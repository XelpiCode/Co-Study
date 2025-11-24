import { NextRequest, NextResponse } from "next/server";
import { cachePdf, getCachedPdf, hasCachedPdf } from "@/lib/server/ncert-cache";

// Mark route as dynamic to avoid static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pdfUrl = searchParams.get("url");

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "PDF URL is required" },
        { status: 400 }
      );
    }

    // Validate that the URL is from ncert.nic.in for security
    try {
      const url = new URL(pdfUrl);
      if (!url.hostname.includes("ncert.nic.in")) {
        return NextResponse.json(
          { error: "Only NCERT PDFs are allowed" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    let pdfBuffer: Buffer;

    if (await hasCachedPdf(pdfUrl)) {
      pdfBuffer = await getCachedPdf(pdfUrl);
    } else {
      // Fetch the PDF from the source
      const response = await fetch(pdfUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        // Set a timeout
        signal: AbortSignal.timeout(30000), // 30 seconds
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch PDF: ${response.statusText}` },
          { status: response.status }
        );
      }

      // Get the PDF data as an array buffer
      const pdfData = await response.arrayBuffer();
      pdfBuffer = Buffer.from(pdfData);

      // Cache on disk for future requests
      await cachePdf(pdfUrl, pdfBuffer);
    }

    const responseBody = pdfBuffer as unknown as BodyInit;

    // Return the PDF with proper headers
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="document.pdf"`,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - PDF took too long to load" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to proxy PDF" },
      { status: 500 }
    );
  }
}

