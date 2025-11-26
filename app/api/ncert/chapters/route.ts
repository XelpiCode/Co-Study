import { NextRequest, NextResponse } from "next/server";
import { getNCERTBookWithChapters } from "@/lib/server/ncert-library";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId") || undefined;
  const classParam = searchParams.get("class") || undefined;
  const subjectParam = searchParams.get("subject") || undefined;
  const subjectGroupParam = searchParams.get("subjectGroup") || undefined;
  const subjectKeyParam = searchParams.get("subjectKey") || undefined;
  const languageParam = searchParams.get("language") || undefined;
  const languageKeyParam = searchParams.get("languageKey") || undefined;

  if (!bookId && !classParam) {
    return NextResponse.json(
      { error: "Missing required parameters: provide either bookId or class" },
      { status: 400 },
    );
  }

  try {
    const bookData = await getNCERTBookWithChapters({
      bookId,
      class: classParam,
      subject: subjectParam ?? undefined,
      subjectGroup: subjectGroupParam ?? undefined,
      subjectKey: subjectKeyParam ?? undefined,
      language: languageParam ?? undefined,
      languageKey: languageKeyParam ?? undefined,
    });

    if (!bookData) {
      return NextResponse.json(
        { error: "No NCERT book found for the provided criteria" },
        { status: 404 },
      );
    }

    return NextResponse.json(bookData);
  } catch (error) {
    console.error("Failed to load NCERT chapters:", error);
    return NextResponse.json(
      { error: "Failed to load NCERT chapters" },
      { status: 500 },
    );
  }
}


