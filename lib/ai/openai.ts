import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

if (!OPENAI_API_KEY) {
  console.warn(
    "OPENAI_API_KEY is not set. AI study planner features will not work until it is configured.",
  );
}

const client = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,
    })
  : null;

class OpenAIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIConfigError";
  }
}

const requireClient = () => {
  if (!client) {
    throw new OpenAIConfigError(
      "OPENAI_API_KEY is not configured. Please set it in your environment to use the AI study planner.",
    );
  }
};

export async function generateText(prompt: string): Promise<string> {
  requireClient();

  const response = await client!.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a friendly, exam-focused CBSE tutor who explains concepts clearly and stays aligned with NCERT and standard CBSE exam patterns.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const message = response.choices[0]?.message?.content;
  if (!message) {
    throw new Error("OpenAI response did not include any text.");
  }

  return message.trim();
}


