import { NCERT_BOOKS } from "../lib/data/ncert-books";
import { cachePdf, getCacheDirectory, getCachePath, hasCachedPdf } from "../lib/server/ncert-cache";

const downloadChapter = async (pdfUrl: string) => {
  try {
    if (await hasCachedPdf(pdfUrl)) {
      console.log(`✓ Already cached: ${pdfUrl}`);
      return;
    }

    console.log(`⇣ Downloading ${pdfUrl}`);
    const response = await fetch(pdfUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Failed with status ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await cachePdf(pdfUrl, buffer);
    console.log(`✓ Cached to ${getCachePath(pdfUrl)}`);
  } catch (error) {
    console.error(`✗ Error caching ${pdfUrl}:`, error);
  }
};

async function downloadAllPdfs() {
  console.log("Starting NCERT PDF download...");
  console.log(`Cache directory: ${getCacheDirectory()}`);

  for (const book of NCERT_BOOKS) {
    console.log(`\nClass ${book.class} - ${book.subject}`);
    for (const chapter of book.chapters) {
      await downloadChapter(chapter.pdfUrl);
    }
  }

  console.log("\nAll downloads attempted. Missing files will be retried next run.");
}

downloadAllPdfs().catch((error) => {
  console.error("Unexpected error while downloading NCERT PDFs:", error);
  process.exit(1);
});

