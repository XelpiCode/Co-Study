import { NCERT_BOOKS, type NCERTBook, type NCERTChapter } from "@/lib/data/ncert-books";
import { getFirebaseAdmin, isFirebaseAdminConfigured } from "@/lib/server/firebase-admin";
import type { DocumentData, Query } from "firebase-admin/firestore";

export type LibrarySource = "firestore" | "static";

export interface NCERTBookRecord {
  id: string;
  class: string;
  subject: string;
  subjectGroup: string;
  subjectKey: string;
  language: string;
  languageKey: string;
  title: string;
  chapterCount: number;
  code?: string;
  source: LibrarySource;
  priority?: number;
}

export interface NCERTChapterRecord {
  id: string;
  number: number;
  title: string;
  derivedTitle?: string;
  pdfUrl: string;
  originalPdfUrl?: string;
  textUrl?: string;
  textPreview?: string;
  sizeBytes?: number;
  source: LibrarySource;
}

export interface NCERTBookResponse {
  source: LibrarySource;
  book: NCERTBookRecord;
  chapters: NCERTChapterRecord[];
}

export interface NCERTLibraryOptions {
  source: LibrarySource;
  classes: Array<{
    class: string;
    subjects: Array<{
      key: string;
      label: string;
      subjectGroup: string;
      books: NCERTBookRecord[];
    }>;
  }>;
}

export interface NCERTBookQuery {
  bookId?: string;
  class?: string;
  subject?: string;
  subjectGroup?: string;
  subjectKey?: string;
  language?: string;
  languageKey?: string;
}

const SUBJECT_GROUP_RULES: Array<{ group: string; patterns: RegExp[] }> = [
  { group: "Math", patterns: [/math/i, /ganit/i, /riyazi/i] },
  { group: "Science", patterns: [/\bscience\b/i, /vigyan/i] },
  {
    group: "Social Science",
    patterns: [/social/i, /history/i, /geography/i, /political/i, /\bcivics?\b/i],
  },
];

const LANGUAGE_CODE_LOOKUP: Record<string, string> = {
  e: "English",
  h: "Hindi",
  u: "Urdu",
  s: "Sanskrit",
};

const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "n-a";

export const resolveSubjectGroup = (subjectName: string) => {
  const normalized = subjectName.toLowerCase();
  for (const rule of SUBJECT_GROUP_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.group;
    }
  }
  return titleCase(subjectName);
};

export const resolveLegacySubjectGroup = (subject: "Math" | "Science" | "Social Studies") => {
  if (subject === "Social Studies") return "Social Science";
  if (subject === "Math") return "Math";
  if (subject === "Science") return "Science";
  return subject;
};

export const detectLanguage = (code: string, subject: string, title: string) => {
  const secondChar = code?.[1]?.toLowerCase();
  if (secondChar && LANGUAGE_CODE_LOOKUP[secondChar]) {
    return LANGUAGE_CODE_LOOKUP[secondChar];
  }

  const combined = `${subject} ${title}`.toLowerCase();
  if (/hindi|bhag|bharati|bhugol|bhartiya|kavita|manav|sanchayan/.test(combined)) {
    return "Hindi";
  }
  if (/urdu|adab|khayaban|riyazi|jarah/.test(combined)) {
    return "Urdu";
  }
  if (/sanskrit|shaswati|bhaswati|vedic/.test(combined)) {
    return "Sanskrit";
  }
  return "English";
};

export const buildBookDocId = ({
  class: classValue,
  subjectKey,
  languageKey,
  code,
}: {
  class: string;
  subjectKey: string;
  languageKey: string;
  code: string;
}) => {
  const classSlug = `class-${classValue.padStart(2, "0")}`;
  return `${classSlug}_${subjectKey}_${languageKey}_${code.toLowerCase()}`;
};

const STATIC_SOURCE: LibrarySource = "static";
const FIRESTORE_SOURCE: LibrarySource = "firestore";
const STATIC_BOOK_PREFIX = "static";

const sortBooks = (books: NCERTBookRecord[]) =>
  books.sort((a, b) => {
    const classDelta = parseInt(a.class, 10) - parseInt(b.class, 10);
    if (classDelta !== 0) return classDelta;
    if ((a.priority ?? 0) !== (b.priority ?? 0)) {
      return (a.priority ?? 0) - (b.priority ?? 0);
    }
    return a.title.localeCompare(b.title);
  });

const buildStaticChapter = (book: NCERTBook, chapter: NCERTChapter): NCERTChapterRecord => ({
  id: `${STATIC_BOOK_PREFIX}-${book.id}-ch-${chapter.number}`,
  number: chapter.number,
  title: chapter.name,
  pdfUrl: chapter.pdfUrl,
  originalPdfUrl: chapter.pdfUrl,
  source: STATIC_SOURCE,
});

const buildStaticBookRecord = (book: NCERTBook): NCERTBookRecord => ({
  id: `${STATIC_BOOK_PREFIX}-${book.id}`,
  class: book.class,
  subject: titleCase(book.subject),
  subjectGroup: book.subject,
  subjectKey: slugify(book.subject),
  language: "English",
  languageKey: "english",
  title: book.title,
  chapterCount: book.chapters.length,
  source: STATIC_SOURCE,
});

const buildStaticOptions = (): NCERTLibraryOptions => {
  const classMap = new Map<
    string,
    {
      class: string;
      subjects: Map<
        string,
        {
          key: string;
          label: string;
          subjectGroup: string;
          books: NCERTBookRecord[];
        }
      >;
    }
  >();

  for (const book of NCERT_BOOKS) {
    const classEntry =
      classMap.get(book.class) ||
      classMap
        .set(book.class, {
          class: book.class,
          subjects: new Map(),
        })
        .get(book.class)!;

    const subjectKey = slugify(book.subject);
    const subjectEntry =
      classEntry.subjects.get(subjectKey) ||
      classEntry.subjects
        .set(subjectKey, {
          key: subjectKey,
          label: titleCase(book.subject),
          subjectGroup: book.subject,
          books: [],
        })
        .get(subjectKey)!;

    subjectEntry.books.push(buildStaticBookRecord(book));
  }

  const classes = Array.from(classMap.values())
    .sort((a, b) => parseInt(a.class, 10) - parseInt(b.class, 10))
    .map((classEntry) => ({
      class: classEntry.class,
      subjects: Array.from(classEntry.subjects.values()).map((subject) => ({
        ...subject,
        books: sortBooks(subject.books),
      })),
    }));

  return {
    source: STATIC_SOURCE,
    classes,
  };
};

const getFirestoreOptions = async () => {
  const { firestore } = getFirebaseAdmin();
  const snapshot = await firestore.collection("ncertBooks").get();

  const classMap = new Map<
    string,
    {
      class: string;
      subjects: Map<
        string,
        {
          key: string;
          label: string;
          subjectGroup: string;
          books: NCERTBookRecord[];
        }
      >;
    }
  >();

  snapshot.forEach((doc) => {
    const data = doc.data() as NCERTBookRecord;
    const classEntry =
      classMap.get(data.class) ||
      classMap
        .set(data.class, {
          class: data.class,
          subjects: new Map(),
        })
        .get(data.class)!;

    const subjectKey = data.subjectKey || slugify(data.subject);
    const subjectEntry =
      classEntry.subjects.get(subjectKey) ||
      classEntry.subjects
        .set(subjectKey, {
          key: subjectKey,
          label: data.subject,
          subjectGroup: data.subjectGroup || resolveSubjectGroup(data.subject),
          books: [],
        })
        .get(subjectKey)!;

    subjectEntry.books.push({
      ...data,
      id: doc.id,
      source: FIRESTORE_SOURCE,
    });
  });

  const classes = Array.from(classMap.values())
    .sort((a, b) => parseInt(a.class, 10) - parseInt(b.class, 10))
    .map((classEntry) => ({
      class: classEntry.class,
      subjects: Array.from(classEntry.subjects.values())
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((subject) => ({
          ...subject,
          books: sortBooks(subject.books),
        })),
    }));

  return {
    source: FIRESTORE_SOURCE,
    classes,
  } satisfies NCERTLibraryOptions;
};

export const getNCERTLibraryOptions = async (): Promise<NCERTLibraryOptions> => {
  if (isFirebaseAdminConfigured()) {
    try {
      return await getFirestoreOptions();
    } catch (error) {
      console.error("Failed to load NCERT library options from Firestore:", error);
    }
  }
  return buildStaticOptions();
};

const buildFirestoreChapterRecord = (
  bookId: string,
  data: DocumentData,
): NCERTChapterRecord | null => {
  const numberValue = typeof data.number === "number" ? data.number : Number(data.number);
  if (!numberValue || Number.isNaN(numberValue)) {
    return null;
  }

  const title =
    data.title ||
    data.derivedTitle ||
    data.defaultTitle ||
    `Chapter ${numberValue.toString().padStart(2, "0")}`;

  const pdfUrl = data.storageDownloadUrl || data.originalPdfUrl;
  if (!pdfUrl) return null;

  return {
    id: `${bookId}-ch-${numberValue.toString().padStart(2, "0")}`,
    number: numberValue,
    title,
    derivedTitle: data.derivedTitle,
    pdfUrl,
    originalPdfUrl: data.originalPdfUrl || pdfUrl,
    textUrl: data.textDownloadUrl,
    textPreview: data.textPreview,
    sizeBytes: data.sizeBytes,
    source: FIRESTORE_SOURCE,
  };
};

const buildFirestoreBookRecord = (docId: string, data: DocumentData): NCERTBookRecord => ({
  id: docId,
  class: data.class,
  subject: data.subject,
  subjectGroup: data.subjectGroup || resolveSubjectGroup(data.subject),
  subjectKey: data.subjectKey || slugify(data.subject),
  language: data.language || "English",
  languageKey: data.languageKey || slugify(data.language || "English"),
  title: data.bookTitle || data.title || data.subject,
  chapterCount: data.chapterCount ?? 0,
  code: data.code,
  priority: data.priority,
  source: FIRESTORE_SOURCE,
});

const getStaticBook = (query: NCERTBookQuery): NCERTBookResponse | null => {
  let targetBook: NCERTBook | undefined;

  if (query.bookId?.startsWith(STATIC_BOOK_PREFIX)) {
    const rawId = query.bookId.replace(`${STATIC_BOOK_PREFIX}-`, "");
    targetBook = NCERT_BOOKS.find((book) => book.id === rawId);
  } else if (query.class && (query.subject || query.subjectGroup)) {
    targetBook = NCERT_BOOKS.find(
      (book) =>
        book.class === query.class &&
        (book.subject === query.subject || book.subject === query.subjectGroup),
    );
  }

  if (!targetBook) {
    return null;
  }

  const bookRecord = buildStaticBookRecord(targetBook);
  const chapters = targetBook.chapters.map((chapter) => buildStaticChapter(targetBook!, chapter));

  return {
    source: STATIC_SOURCE,
    book: bookRecord,
    chapters,
  };
};

const getFirestoreBook = async (query: NCERTBookQuery): Promise<NCERTBookResponse | null> => {
  const { firestore } = getFirebaseAdmin();
  const booksRef = firestore.collection("ncertBooks");

  if (query.bookId) {
    const docSnap = await booksRef.doc(query.bookId).get();
    if (!docSnap.exists) {
      return null;
    }
    const bookRecord = buildFirestoreBookRecord(docSnap.id, docSnap.data()!);
    const chaptersSnapshot = await docSnap.ref.collection("chapters").orderBy("number").get();
    const chapters = chaptersSnapshot.docs
      .map((doc) => buildFirestoreChapterRecord(bookRecord.id, doc.data()))
      .filter(Boolean) as NCERTChapterRecord[];
    return { source: FIRESTORE_SOURCE, book: bookRecord, chapters };
  }

  const classValue = query.class;
  if (!classValue) return null;

  let firestoreQuery: Query<DocumentData> = booksRef.where("class", "==", classValue);

  if (query.subjectKey) {
    firestoreQuery = firestoreQuery.where("subjectKey", "==", query.subjectKey);
  } else if (query.subjectGroup) {
    firestoreQuery = firestoreQuery.where("subjectGroup", "==", query.subjectGroup);
  } else if (query.subject) {
    firestoreQuery = firestoreQuery.where("subject", "==", query.subject);
  }

  if (query.languageKey) {
    firestoreQuery = firestoreQuery.where("languageKey", "==", query.languageKey);
  } else if (query.language) {
    firestoreQuery = firestoreQuery.where("language", "==", query.language);
  }

  const docsSnapshot = await firestoreQuery.orderBy("priority", "asc").limit(1).get();
  if (docsSnapshot.empty) {
    if (query.language || query.languageKey) {
      // Retry without language filter
      return getFirestoreBook({ class: classValue, subject: query.subject, subjectGroup: query.subjectGroup, subjectKey: query.subjectKey });
    }
    return null;
  }

  const bookDoc = docsSnapshot.docs[0];
  return getFirestoreBook({ bookId: bookDoc.id });
};

export const getNCERTBookWithChapters = async (
  query: NCERTBookQuery,
): Promise<NCERTBookResponse | null> => {
  if (query.bookId && query.bookId.startsWith(STATIC_BOOK_PREFIX)) {
    return getStaticBook(query);
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const result = await getFirestoreBook(query);
      if (result) {
        return result;
      }
    } catch (error) {
      console.error("Failed to fetch NCERT book from Firestore:", error);
    }
  }

  return getStaticBook(query);
};


