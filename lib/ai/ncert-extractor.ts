import { getPdfBuffer, extractPdfText } from "@/lib/server/ncert-pdf";
import {
  getNCERTBookWithChapters,
  resolveLegacySubjectGroup,
  type NCERTBookRecord,
  type NCERTChapterRecord,
} from "@/lib/server/ncert-library";

export interface NCERTExtractionResult {
  book: NCERTBookRecord;
  chapter: NCERTChapterRecord;
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

const findChapter = (
  chapters: NCERTChapterRecord[],
  topicName: string,
): NCERTChapterRecord | null => {
  let bestChapter: NCERTChapterRecord | null = null;
  let bestScore = 0;

  for (const chapter of chapters) {
    const score = getMatchScore(chapter.title, topicName);
    if (score > bestScore) {
      bestScore = score;
      bestChapter = chapter;
    }
  }

  return bestChapter ?? chapters[0] ?? null;
};

export const getNCERTTextForTopic = async (
  classNum: string,
  subject: "Math" | "Science" | "Social Studies",
  topicName: string,
): Promise<NCERTExtractionResult | null> => {
  const bookResponse = await getNCERTBookWithChapters({
    class: classNum,
    subjectGroup: resolveLegacySubjectGroup(subject),
    language: "English",
  });

  if (!bookResponse?.chapters.length) {
    return null;
  }

  const chapter = findChapter(bookResponse.chapters, topicName);
  if (!chapter) return null;

  const text = await loadChapterText(chapter);
  if (!text) return null;

  return {
    book: bookResponse.book,
    chapter,
    text,
  };
};

const loadChapterText = async (chapter: NCERTChapterRecord) => {
  if (chapter.textUrl) {
    try {
      const response = await fetch(chapter.textUrl, { signal: AbortSignal.timeout(30000) });
      if (response.ok) {
        const text = await response.text();
        if (text?.trim()) {
          return text;
        }
      }
    } catch (error) {
      console.warn("Failed to load cached NCERT text, falling back to PDF:", error);
    }
  }

  try {
    const buffer = await getPdfBuffer(chapter.pdfUrl);
    return extractPdfText(buffer, { maxPages: MAX_PAGES, maxChars: MAX_CHARS });
  } catch (error) {
    console.error("Failed to parse NCERT PDF:", error);
    return null;
  }
};


