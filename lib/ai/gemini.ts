const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-1.5-flash-latest";
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
const API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  promptFeedback?: {
    safetyRatings?: Array<{ category: string; probability: string }>;
  };
  error?: { code?: number; message?: string };
}

class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

const requireApiKey = () => {
  if (!GEMINI_API_KEY) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY is not configured. Please set it in your environment.",
    );
  }
};

const extractText = (response: GeminiGenerateResponse) => {
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts?.length) {
    throw new Error("Gemini response did not include any text.");
  }

  return parts
    .map((part) => part.text?.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
};

const callGemini = async (model: string, parts: GeminiPart[]) => {
  requireApiKey();

  const endpoint = `${API_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as GeminiGenerateResponse;
};

export async function generateText(prompt: string): Promise<string> {
  const response = await callGemini(DEFAULT_MODEL, [{ text: prompt }]);
  return extractText(response);
}

export async function generateTextWithImage(
  prompt: string,
  imageData: string,
  imageMimeType: string,
): Promise<string> {
  const response = await callGemini(IMAGE_MODEL, [
    { text: prompt },
    {
      inline_data: {
        mime_type: imageMimeType,
        data: imageData,
      },
    },
  ]);
  return extractText(response);
}


