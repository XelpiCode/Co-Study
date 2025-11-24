import { NCERT_BOOKS } from "@/lib/data/ncert-books";

export interface CBSEResource {
  title: string;
  url: string;
  snippet: string;
  source: string;
  type?: "textbook" | "sample-paper" | "video" | "article";
}

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const findChapter = (classNum: string, subject: string, topic: string) => {
  const book = NCERT_BOOKS.find(
    (entry) => entry.class === classNum && entry.subject === subject,
  );
  if (!book) return null;

  const normalizedTopic = topic.toLowerCase();

  return (
    book.chapters.find((chapter) =>
      chapter.name.toLowerCase().includes(normalizedTopic),
    ) || book.chapters[0]
  );
};

export const searchCBSEResources = async (
  topic: string,
  classNum: string,
  subject: "Math" | "Science" | "Social Studies",
): Promise<CBSEResource[]> => {
  const normalizedTopic = titleCase(topic);
  const encodedQuery = encodeURIComponent(`${topic} class ${classNum} ${subject} CBSE`);
  const resources: CBSEResource[] = [];

  const chapter = findChapter(classNum, subject, topic);
  if (chapter) {
    resources.push({
      title: `${normalizedTopic} (NCERT Chapter ${chapter.number})`,
      url: chapter.pdfUrl,
      snippet: "Official NCERT textbook chapter for detailed explanations and exercises.",
      source: "NCERT",
      type: "textbook",
    });
  }

  resources.push(
    {
      title: `${normalizedTopic} - CBSE Sample Questions`,
      url: `https://www.google.com/search?q=${encodedQuery}+sample+questions`,
      snippet: "Practice CBSE-style questions and previous year problems related to this topic.",
      source: "CBSE Academic",
      type: "sample-paper",
    },
    {
      title: `${normalizedTopic} - Video Lessons`,
      url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      snippet: "Curated explainer videos from verified CBSE educators.",
      source: "YouTube",
      type: "video",
    },
    {
      title: `${normalizedTopic} - Revision Notes`,
      url: `https://www.google.com/search?q=${encodedQuery}+revision+notes`,
      snippet: "Quick revision notes and mind maps from trusted CBSE portals.",
      source: "Topper / Vedantu / Byju's",
      type: "article",
    },
  );

  return resources;
};

export const formatSearchResultsForAI = (resources: CBSEResource[]) => {
  if (!resources.length) {
    return "";
  }

  const lines = ["# Additional CBSE Resources"];

  resources.forEach((resource, index) => {
    lines.push(
      `${index + 1}. ${resource.title} (${resource.source}) - ${resource.snippet} [${resource.url}]`,
    );
  });

  return lines.join("\n");
};


