/* eslint-disable no-console */
import dotenv from "dotenv";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import type { Storage } from "firebase-admin/storage";
import { deriveChapterTitle } from "@/lib/server/ncert-metadata";
import { extractPdfText } from "@/lib/server/ncert-pdf";
import { getFirebaseAdmin } from "@/lib/server/firebase-admin";

// Load environment variables for standalone script execution
dotenv.config({ path: ".env.local" });
import {
  buildBookDocId,
  detectLanguage,
  resolveSubjectGroup,
  slugify,
} from "@/lib/server/ncert-library";

const TEXTBOOK_PAGE_URL = "https://ncert.nic.in/textbook.php?ln=en";
const PDF_BASE_URL = "https://ncert.nic.in/textbook/pdf";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36";

const TARGET_CLASSES = new Set(
  (process.env.SCRAPE_CLASSES || "9,10,11,12")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

const SUBJECT_FILTER = new Set(
  (process.env.SCRAPE_SUBJECTS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const LANGUAGE_FILTER = new Set(
  (process.env.SCRAPE_LANGUAGES || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const MAX_PDF_PAGES = parseInt(process.env.SCRAPE_MAX_PAGES || "6", 10);
const MAX_TEXT_CHARS = parseInt(process.env.SCRAPE_MAX_CHARS || "15000", 10);
const BOOK_DELAY_MS = parseInt(process.env.SCRAPE_BOOK_DELAY_MS || "0", 10);

const LANGUAGE_PRIORITY: Record<string, number> = {
  english: 0,
  hindi: 1,
  urdu: 2,
  sanskrit: 3,
};

interface BookSpec {
  class: string;
  subject: string;
  subjectKey: string;
  subjectGroup: string;
  title: string;
  code: string;
  rawValue: string;
  chapterCount: number;
  sourceUrl: string;
  language: string;
  languageKey: string;
  priority: number;
}

interface ChapterUploadResult {
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
}

type StorageBucket = ReturnType<Storage["bucket"]>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
  maxRetries = 3,
  baseDelay = 2000,
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      console.log(`  Attempting to fetch ${url} (attempt ${attempt}/${maxRetries})...`);

      const response = await fetch(url, {
        ...init,
        // New AbortSignal on each attempt
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${url} (${response.status})`);
      }

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown fetch error");
      lastError = err;
      console.warn(`  ✗ Attempt ${attempt} failed:`, err.message);

      if (attempt < maxRetries) {
        const delay = baseDelay * 2 ** (attempt - 1);
        console.log(`  ⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Failed to fetch ${url} after ${maxRetries} attempts. Last error: ${lastError?.message}`,
  );
};

const fetchHtml = async (url: string) => {
  const response = await fetchWithRetry(
    url,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    },
    45000,
  );

  return response.text();
};

const parseBookSpecs = (html: string): BookSpec[] => {
  const specs: BookSpec[] = [];
  const subjectBlockRegex =
    /else if\(\(document\.test\.tclass\.value==(.*?)\)\s*&&\s*\(document\.test\.tsubject\.options\[sind\]\.text=="([^"]+)"\)\)\s*\{([\s\S]*?)(?=}\s*else if|}\s*function|$)/g;

  let subjectMatch: RegExpExecArray | null;

  while ((subjectMatch = subjectBlockRegex.exec(html)) !== null) {
    const classValue = subjectMatch[1].trim();
    const subject = subjectMatch[2].trim();

    if (!TARGET_CLASSES.has(classValue)) continue;
    if (SUBJECT_FILTER.size && !SUBJECT_FILTER.has(subject.toLowerCase())) continue;

    const bookBlock = subjectMatch[3];
    const bookRegex =
      /document\.test\.tbook\.options\[(\d+)]\.text="([^"]+)"[\s;]*document\.test\.tbook\.options\[\1].value="textbook\.php\?([^"]+)"/g;

    let bookMatch: RegExpExecArray | null;
    while ((bookMatch = bookRegex.exec(bookBlock)) !== null) {
      const title = bookMatch[2].trim();
      const rawValue = bookMatch[3].trim();

      if (!title || title.startsWith("..Select")) continue;

      const [code, range] = rawValue.split("=");
      if (!code || !range) continue;

      const chapterMatch = range.match(/(\d+)-(\d+)/);
      if (!chapterMatch) continue;
      const chapterCount = parseInt(chapterMatch[2], 10);
      if (!chapterCount || Number.isNaN(chapterCount)) continue;

      const subjectGroup = resolveSubjectGroup(subject);
      const subjectKey = slugify(subject);
      const language = detectLanguage(code, subject, title);
      const languageKey = slugify(language);

      if (LANGUAGE_FILTER.size && !LANGUAGE_FILTER.has(languageKey)) continue;

      specs.push({
        class: classValue,
        subject,
        subjectKey,
        subjectGroup,
        title,
        code,
        rawValue,
        chapterCount,
        sourceUrl: `https://ncert.nic.in/textbook.php?${rawValue}`,
        language,
        languageKey,
        priority: LANGUAGE_PRIORITY[languageKey] ?? 5,
      });
    }
  }

  return specs;
};

const downloadPdf = async (url: string) => {
  const response = await fetchWithRetry(
    url,
    {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    },
    60000,
  );

  return Buffer.from(await response.arrayBuffer());
};

const buildStorageDownloadUrl = (bucket: string, path: string, token: string) => {
  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media&token=${token}`;
};

const uploadBinary = async (
  bucket: StorageBucket,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<ChapterUploadResult> => {
  const file = bucket.file(path);
  const token = crypto.randomUUID();

  await file.save(buffer, {
    resumable: false,
    gzip: false,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  return {
    storagePath: path,
    downloadUrl: buildStorageDownloadUrl(bucket.name, path, token),
    sizeBytes: buffer.length,
  };
};

const processBook = async (book: BookSpec) => {
  const { firestore, bucket } = getFirebaseAdmin();
  const booksCollection = firestore.collection("ncertBooks");
  const bookId = buildBookDocId({
    class: book.class,
    subjectKey: book.subjectKey,
    languageKey: book.languageKey,
    code: book.code,
  });

  const bookRef = booksCollection.doc(bookId);
  const existingBook = await bookRef.get();

  await bookRef.set(
    {
      id: bookId,
      class: book.class,
      subject: book.subject,
      subjectGroup: book.subjectGroup,
      subjectKey: book.subjectKey,
      language: book.language,
      languageKey: book.languageKey,
      bookTitle: book.title,
      code: book.code,
      chapterCount: book.chapterCount,
      sourceValue: book.rawValue,
      sourceUrl: book.sourceUrl,
      priority: book.priority,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existingBook.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  console.log(
    `↳ ${book.class} • ${book.subject} (${book.language}) – ${book.title} [${book.chapterCount} chapters]`,
  );

  const baseStoragePath = `ncert/class-${book.class.padStart(2, "0")}/${book.subjectKey}/${book.code}`;
  const chaptersCollection = bookRef.collection("chapters");

  for (let chapterNumber = 1; chapterNumber <= book.chapterCount; chapterNumber += 1) {
    const padded = chapterNumber.toString().padStart(2, "0");
    const pdfId = `${book.code}${padded}`;
    const pdfSourceUrl = `${PDF_BASE_URL}/${pdfId}.pdf`;
    const chapterRef = chaptersCollection.doc(padded);
    const existingChapter = await chapterRef.get();

    try {
      console.log(`    • Chapter ${chapterNumber} • downloading ${pdfSourceUrl}`);
      const pdfBuffer = await downloadPdf(pdfSourceUrl);
      const pdfHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

      const text = await extractPdfText(pdfBuffer, {
        maxPages: MAX_PDF_PAGES,
        maxChars: MAX_TEXT_CHARS,
      });
      const derivedTitle = deriveChapterTitle(text || "") || `Chapter ${chapterNumber}`;
      const textPreview = (text || "").replace(/\s+/g, " ").trim().slice(0, 500);
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

      const pdfStoragePath = `${baseStoragePath}/${pdfId}.pdf`;
      const pdfUpload = await uploadBinary(bucket, pdfStoragePath, pdfBuffer, "application/pdf");

      let textUpload: ChapterUploadResult | null = null;
      if (text) {
        const textPath = `${baseStoragePath}/${pdfId}.txt`;
        textUpload = await uploadBinary(bucket, textPath, Buffer.from(text, "utf-8"), "text/plain");
      }

      await chapterRef.set(
        {
          number: chapterNumber,
          title: derivedTitle,
          derivedTitle,
          defaultTitle: `Chapter ${chapterNumber}`,
          pdfStoragePath,
          storageDownloadUrl: pdfUpload.downloadUrl,
          originalPdfUrl: pdfSourceUrl,
          pdfSha256: pdfHash,
          sizeBytes: pdfUpload.sizeBytes,
          textStoragePath: textUpload?.storagePath ?? null,
          textDownloadUrl: textUpload?.downloadUrl ?? null,
          textPreview: textPreview || null,
          wordCount,
          updatedAt: FieldValue.serverTimestamp(),
          ...(existingChapter.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );
    } catch (error) {
      console.error(
        `      ✗ Failed to process chapter ${chapterNumber} for ${book.title}:`,
        error,
      );
    }
  }
};

const main = async () => {
  console.log("Fetching NCERT textbook index…");
  const html = await fetchHtml(TEXTBOOK_PAGE_URL);
  const specs = parseBookSpecs(html);

  if (!specs.length) {
    console.warn("No NCERT book entries found. Check filters or website structure.");
    return;
  }

  console.log(`Found ${specs.length} textbook entries. Starting upload…`);

  // Build per-class progress metadata
  const classStats = new Map<
    string,
    {
      total: number;
      done: number;
    }
  >();

  for (const spec of specs) {
    const entry = classStats.get(spec.class) ?? { total: 0, done: 0 };
    entry.total += 1;
    classStats.set(spec.class, entry);
  }

  const totalBooks = specs.length;

  for (let index = 0; index < specs.length; index += 1) {
    const book = specs[index];
    const overallPosition = index + 1;

    const stats = classStats.get(book.class)!;
    stats.done += 1;
    classStats.set(book.class, stats);

    console.log(
      `\n[Class ${book.class}] Book ${stats.done}/${stats.total} • Overall ${overallPosition}/${totalBooks}`,
    );

    await processBook(book);
    if (BOOK_DELAY_MS > 0) {
      await sleep(BOOK_DELAY_MS);
    }
  }

  console.log("NCERT scraping completed.");
};

main().catch((error) => {
  console.error("NCERT scraping failed:", error);
  process.exit(1);
});


