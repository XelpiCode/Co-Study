import { NextRequest, NextResponse } from "next/server";
import { getBookWithTitles } from "@/lib/server/ncert-metadata";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classParam = searchParams.get("class");
  const subjectParam = searchParams.get("subject");

  if (!classParam || !subjectParam) {
    return NextResponse.json(
      { error: "Missing required parameters: class and subject" },
      { status: 400 },
    );
  }

  const allowedSubjects = ["Math", "Science", "Social Studies"] as const;
  if (!allowedSubjects.includes(subjectParam as (typeof allowedSubjects)[number])) {
    return NextResponse.json({ error: "Invalid subject parameter" }, { status: 400 });
  }

  const bookData = await getBookWithTitles(
    classParam,
    subjectParam as (typeof allowedSubjects)[number],
  );

  if (!bookData) {
    return NextResponse.json(
      { error: "No NCERT book found for the provided class and subject" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    book: {
      id: bookData.book.id,
      class: bookData.book.class,
      subject: bookData.book.subject,
      title: bookData.book.title,
    },
    chapters: bookData.chapters,
  });
}


