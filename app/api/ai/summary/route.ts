import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/openai";
import { getNCERTTextForTopic } from "@/lib/ai/ncert-extractor";
import { searchCBSEResources, formatSearchResultsForAI } from "@/lib/ai/search";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds for AI processing

interface SummaryRequest {
  prompt: string;
  class: string;
  subject?: string;
  chapter?: string;
  imageData?: string;
  imageMimeType?: string;
}

/**
 * Identify subject and chapter from prompt using AI
 */
async function identifyTopic(prompt: string, classNum: string): Promise<{
  subject: "Math" | "Science" | "Social Studies" | null;
  chapterName: string;
  confidence: number;
}> {
  const identificationPrompt = `You are an expert at identifying CBSE curriculum topics. Given a student's prompt about what they want to learn, identify:
1. The subject (Math, Science, or Social Studies)
2. The chapter/topic name
3. Your confidence level (0-1)

Student prompt: "${prompt}"
Student class: Class ${classNum}

Respond in JSON format:
{
  "subject": "Math" | "Science" | "Social Studies" | null,
  "chapterName": "string",
  "confidence": number
}

If you cannot confidently identify the subject, set subject to null.`;

  try {
    const response = await generateText(identificationPrompt);
    
    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject: parsed.subject || null,
        chapterName: parsed.chapterName || prompt,
        confidence: parsed.confidence || 0.5,
      };
    }
    
    // Fallback: try to extract subject from response text
    const lowerResponse = response.toLowerCase();
    let subject: "Math" | "Science" | "Social Studies" | null = null;
    if (lowerResponse.includes("math") || lowerResponse.includes("mathematics")) {
      subject = "Math";
    } else if (lowerResponse.includes("science")) {
      subject = "Science";
    } else if (lowerResponse.includes("social") || lowerResponse.includes("history") || lowerResponse.includes("geography")) {
      subject = "Social Studies";
    }

    return {
      subject,
      chapterName: prompt,
      confidence: 0.5,
    };
  } catch (error) {
    console.error("Error identifying topic:", error);
    return {
      subject: null,
      chapterName: prompt,
      confidence: 0,
    };
  }
}

/**
 * Generate comprehensive study summary
 */
async function generateSummary(
  prompt: string,
  classNum: string,
  subject: "Math" | "Science" | "Social Studies",
  ncertText: string | null,
  searchResults: string,
): Promise<string> {
  const systemPrompt = `You are an expert CBSE tutor helping a Class ${classNum} student learn ${subject}. Your task is to create a comprehensive, easy-to-understand study summary.

Hard formatting rules (MUST follow exactly):
- Use Markdown.
- Start with a single line title: "Study Summary: [Topic Name]" (no leading # on this line).
- Then add a blank line and the section "## Key Concepts".
- Use the following section headings in this exact order:
  1) "## Key Concepts"
  2) "## Important Definitions"
  3) "## Formulas/Key Points"
  4) "## Step-by-Step Explanation"
  5) "## Practice Questions"
  6) "## Study Tips"
  7) "## Quick Revision Points"
- Put a line containing exactly three dashes --- on its own line BETWEEN each major section (like a visual divider).
- Use normal paragraphs and "-" bullet lists inside sections, NOT extra headings.
- Do not add any other top-level headings outside this structure.

Content guidelines:
1. Use simple, student-friendly language (Class ${classNum} level)
2. Break down complex concepts into easy steps
3. Include key definitions, formulas, and important points
4. Provide 2–3 CBSE-style practice questions with short answers
5. Include study tips and memory aids
6. Reference NCERT content when provided
7. Use the additional resources to find relevant CBSE exam questions and study guides

${ncertText ? `NCERT Textbook Content for this chapter (truncated):\n${ncertText.substring(0, 8000)}\n` : "Note: NCERT text not found. Use your knowledge of CBSE curriculum.\n"}

${searchResults ? `Additional CBSE-related resources:\n${searchResults}\n` : ""}

Student's request: "${prompt}"

Now generate the study summary ONLY in the required Markdown structure described above.`;

  try {
    // Image uploads are currently ignored by the ChatGPT backend, but the
    // route still accepts them so the existing UI keeps working.
    return await generateText(systemPrompt);
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate study summary");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const classNum = formData.get("class") as string;
    const subject = formData.get("subject") as string | null;
    const manualChapter = formData.get("chapter") as string | null;
    const imageFile = formData.get("image") as File | null;

    if (!prompt || !classNum) {
      return NextResponse.json(
        { error: "Prompt and class are required" },
        { status: 400 }
      );
    }

    // Convert image to base64 if provided
    let imageData: string | undefined;
    let imageMimeType: string | undefined;
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageData = buffer.toString("base64");
      imageMimeType = imageFile.type || "image/jpeg";
    }

    // Step 1: Identify subject and chapter
    let identifiedSubject: "Math" | "Science" | "Social Studies" | null = null;
    // Prefer an explicitly selected chapter if the user chose one
    let chapterName = manualChapter && manualChapter.trim().length > 0 ? manualChapter : prompt;

    if (subject && subject.trim()) {
      // Use provided subject if available - normalize it
      const normalizedSubject = subject.trim().toLowerCase();
      const subjectMap: Record<string, "Math" | "Science" | "Social Studies"> = {
        math: "Math",
        maths: "Math",
        mathematics: "Math",
        science: "Science",
        "social studies": "Social Studies",
        "s.s": "Social Studies",
        ss: "Social Studies",
        social: "Social Studies",
        history: "Social Studies",
        geography: "Social Studies",
      };
      identifiedSubject = subjectMap[normalizedSubject] || null;
      
      console.log(`Subject provided: "${subject}" -> normalized: "${normalizedSubject}" -> mapped: ${identifiedSubject}`);
    }

    if (!identifiedSubject && !manualChapter) {
      console.log("Subject not provided or not recognized, attempting AI identification...");
      // Auto-identify using AI
      try {
        const identification = await identifyTopic(prompt, classNum);
        identifiedSubject = identification.subject;
        chapterName = identification.chapterName;
        console.log(`AI identification result: subject=${identifiedSubject}, chapter=${chapterName}`);
      } catch (error) {
        console.error("Error in AI identification:", error);
        // Continue without AI identification
      }
    }

    if (!identifiedSubject) {
      // If we still couldn't confidently identify a subject (for example,
      // for English or AI topics), fall back to a generic bucket so that
      // the AI summary can still be generated using general knowledge.
      console.warn(
        "Could not confidently identify subject from prompt; falling back to Social Studies for AI-only summary.",
      );
      identifiedSubject = "Social Studies";
    }

    // Step 2: Get NCERT text (non-blocking - continue even if it fails)
    let ncertText: string | null = null;
    let ncertChapter: string | null = null;
    try {
      console.log(`Attempting to fetch NCERT text for: Class ${classNum}, ${identifiedSubject}, "${chapterName}"`);
      const ncertData = await getNCERTTextForTopic(classNum, identifiedSubject, chapterName);
      if (ncertData) {
        ncertText = ncertData.text;
        // NCERTChapterRecord uses "title" rather than "name"
        ncertChapter = `${ncertData.chapter.title} (Chapter ${ncertData.chapter.number})`;
        console.log(`Successfully fetched NCERT text for chapter: ${ncertChapter}`);
      } else {
        console.log("No matching NCERT chapter found");
      }
    } catch (error) {
      console.error("Error fetching NCERT text (continuing without it):", error);
      // Continue without NCERT text - this is not a fatal error
    }

    // Step 3: Search for additional resources
    let searchResults = "";
    try {
      const searchData = await searchCBSEResources(chapterName, classNum, identifiedSubject);
      searchResults = formatSearchResultsForAI(searchData);
    } catch (error) {
      console.error("Error searching resources:", error);
      // Continue without search results
    }

    // Step 4: Generate summary
    console.log("Generating summary with ChatGPT (OpenAI)...");
    let summary: string;
    try {
      summary = await generateSummary(prompt, classNum, identifiedSubject, ncertText, searchResults);
      console.log("Summary generated successfully with ChatGPT");
    } catch (error) {
      console.error("Error generating summary with ChatGPT:", error);
      throw new Error(
        error instanceof Error 
          ? `Failed to generate summary: ${error.message}` 
          : "Failed to generate summary. Please check if OPENAI_API_KEY is configured."
      );
    }

    return NextResponse.json({
      summary,
      subject: identifiedSubject,
      chapter: ncertChapter || chapterName,
      ncertReferenced: !!ncertText,
    });
  } catch (error) {
    console.error("Error in summary API route:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate summary";
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.stack : undefined)
          : undefined,
      },
      { status: 500 }
    );
  }
}

