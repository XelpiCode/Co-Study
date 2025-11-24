import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIRECTORY = path.join(process.cwd(), "public", "ncert-cache");

const ensureCacheDir = async () => {
  await fs.mkdir(CACHE_DIRECTORY, { recursive: true });
};

const getFileNameFromUrl = (pdfUrl: string) => {
  const hash = crypto.createHash("sha256").update(pdfUrl).digest("hex");
  const originalName = pdfUrl.split("/").pop() || "ncert.pdf";
  return `${hash.slice(0, 12)}-${originalName}`;
};

export const getCachePath = (pdfUrl: string) => path.join(CACHE_DIRECTORY, getFileNameFromUrl(pdfUrl));

export const getCachedPdf = async (pdfUrl: string) => {
  const cachePath = getCachePath(pdfUrl);
  await ensureCacheDir();
  return fs.readFile(cachePath);
};

export const cachePdf = async (pdfUrl: string, data: Buffer) => {
  const cachePath = getCachePath(pdfUrl);
  await ensureCacheDir();
  await fs.writeFile(cachePath, data);
  return cachePath;
};

export const hasCachedPdf = async (pdfUrl: string) => {
  const cachePath = getCachePath(pdfUrl);
  try {
    await fs.access(cachePath);
    return true;
  } catch {
    return false;
  }
};

export const getCacheDirectory = () => CACHE_DIRECTORY;

