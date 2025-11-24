import { promises as fs } from "fs";
import { cachePdf, getCachePath } from "@/lib/server/ncert-cache";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)";

export interface ExtractOptions {
  maxPages?: number;
  maxChars?: number;
}

const downloadPdf = async (pdfUrl: string) => {
  const response = await fetch(pdfUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Failed to download NCERT PDF (${response.status}): ${pdfUrl}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await cachePdf(pdfUrl, buffer);
  return buffer;
};

export const getPdfBuffer = async (pdfUrl: string) => {
  const cachePath = getCachePath(pdfUrl);
  try {
    return await fs.readFile(cachePath);
  } catch {
    return downloadPdf(pdfUrl);
  }
};

export const extractPdfText = async (buffer: Buffer, options: ExtractOptions = {}) => {
  const pdfParse = (await import("pdf-parse")).default as (
    dataBuffer: Buffer,
    opts?: { max?: number },
  ) => Promise<{ text: string }>;

  const data = await pdfParse(buffer, { max: options.maxPages });
  const text = data.text?.replace(/\s+\n/g, "\n").trim() || "";
  if (options.maxChars && text.length > options.maxChars) {
    return text.slice(0, options.maxChars);
  }
  return text;
};


