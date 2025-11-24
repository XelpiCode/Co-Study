import { NCERT_BOOKS, NCERTBook, NCERTChapter } from "@/lib/data/ncert-books";
import { getPdfBuffer, extractPdfText } from "@/lib/server/ncert-pdf";

export interface NCERTExtractionResult {
  book: NCERTBook;
  chapter: NCERTChapter;
  text: string;
}

const NORMALIZE_REGEX = /[^a-z0-9\s]/g;
const MAX_PAGES = parseInt(process.env.NCERT_EXTRACT_MAX_PAGES || "6", 10);
const MAX_CHARS = parseInt(process.env.NCERT_EXTRACT_MAX_CHARS || "8000", 10);

const normalize = (value: string) =>
  value.toLowerCase().replace(NORMALIZE_REGEX, " ").replace(/\s+/g, " ").trim();

const getMatchScore = (chapterName: string, topic: string) => {
  const chapter = normalize(chapterName);
  const query = normalize(topic);
  if (!chapter || !query) return 0;

  if (chapter === query) return 1;

  const queryWords = query.split(" ").filter((word) => word.length > 2);
  if (!queryWords.length) return 0;

  const matches = queryWords.filter((word) => chapter.includes(word));
  return matches.length / queryWords.length;
};

const findChapter = (classNum: string, subject: string, topicName: string) => {
  const book = NCERT_BOOKS.find(
    (entry) => entry.class === classNum && entry.subject === subject,
  );
  if (!book) {
    return null;
  }

  let bestChapter: NCERTChapter | null = null;
  let bestScore = 0;

  for (const chapter of book.chapters) {
    const score = getMatchScore(chapter.name, topicName);
    if (score > bestScore) {
      bestScore = score;
      bestChapter = chapter;
    }
  }

  if (!bestChapter) {
    bestChapter = book.chapters[0];
  }

  return { book, chapter: bestChapter };
};

export const getNCERTTextForTopic = async (
  classNum: string,
  subject: "Math" | "Science" | "Social Studies",
  topicName: string,
): Promise<NCERTExtractionResult | null> => {
  const result = findChapter(classNum, subject, topicName);
  if (!result) {
    return null;
  }

  try {
    const buffer = await getPdfBuffer(result.chapter.pdfUrl);
    const text = await extractPdfText(buffer, { maxPages: MAX_PAGES, maxChars: MAX_CHARS });
    if (!text) {
      return null;
    }

    return {
      book: result.book,
      chapter: result.chapter,
      text,
    };
  } catch (error) {
    console.error("Failed to parse NCERT PDF:", error);
    return null;
  }
};


