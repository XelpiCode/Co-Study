import {
  getNCERTBookWithChapters,
  resolveLegacySubjectGroup,
  type NCERTChapterRecord,
} from "@/lib/server/ncert-library";

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

const findChapter = (chapters: NCERTChapterRecord[], topic: string) => {
  const normalizedTopic = topic.toLowerCase();
  return (
    chapters.find((chapter) => chapter.title.toLowerCase().includes(normalizedTopic)) ||
    chapters[0]
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

  try {
    const bookData = await getNCERTBookWithChapters({
      class: classNum,
      subjectGroup: resolveLegacySubjectGroup(subject),
      language: "English",
    });
    if (bookData?.chapters.length) {
      const chapter = findChapter(bookData.chapters, topic);
      if (chapter) {
        resources.push({
          title: `${normalizedTopic} (NCERT Chapter ${chapter.number})`,
          url: chapter.pdfUrl,
          snippet: "Official NCERT textbook chapter for detailed explanations and exercises.",
          source: "NCERT",
          type: "textbook",
        });
      }
    }
  } catch (error) {
    console.warn("Unable to load NCERT textbook data for CBSE search:", error);
  }

  if (!resources.length) {
    resources.push({
      title: `${normalizedTopic} (NCERT Reference)`,
      url: "https://ncert.nic.in/textbook.php",
      snippet: "Browse the NCERT textbook library to locate the relevant chapter.",
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


