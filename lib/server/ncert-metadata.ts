import { NCERTChapter, NCERTBook, NCERT_BOOKS } from "@/lib/data/ncert-books";
import { extractPdfText, getPdfBuffer } from "@/lib/server/ncert-pdf";

const titleCache = new Map<string, Promise<string>>();

const slugFromUrl = (pdfUrl: string) => pdfUrl.split("/").pop() || pdfUrl;

export const deriveChapterTitle = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const chapterLine =
    lines.find((line) => /^chapter\s+\d+/i.test(line)) ||
    lines.find((line) => /^[A-Za-z].{10,}/.test(line));

  if (!chapterLine) {
    return "NCERT Chapter";
  }

  // Normalize spacing in "Chapter X" prefix
  return chapterLine.replace(/\s{2,}/g, " ").trim();
};

const loadTitle = async (chapter: NCERTChapter) => {
  const buffer = await getPdfBuffer(chapter.pdfUrl);
  const text = await extractPdfText(buffer, { maxPages: 1, maxChars: 1000 });
  return deriveChapterTitle(text);
};

export const getChapterTitle = async (chapter: NCERTChapter) => {
  const slug = slugFromUrl(chapter.pdfUrl);
  if (!titleCache.has(slug)) {
    titleCache.set(
      slug,
      loadTitle(chapter).catch((error) => {
        console.error(`Failed to derive NCERT title for ${slug}:`, error);
        return chapter.name;
      }),
    );
  }

  return titleCache.get(slug)!;
};

export interface ChapterMetadata {
  number: number;
  defaultName: string;
  derivedTitle: string;
  pdfUrl: string;
}

export const getBookWithTitles = async (
  classNum: string,
  subject: "Math" | "Science" | "Social Studies",
): Promise<{ book: NCERTBook; chapters: ChapterMetadata[] } | null> => {
  const book = NCERT_BOOKS.find(
    (entry) => entry.class === classNum && entry.subject === subject,
  );

  if (!book) {
    return null;
  }

  const chapters = await Promise.all(
    book.chapters.map(async (chapter) => ({
      number: chapter.number,
      defaultName: chapter.name,
      derivedTitle: await getChapterTitle(chapter),
      pdfUrl: chapter.pdfUrl,
    })),
  );

  return { book, chapters };
};


