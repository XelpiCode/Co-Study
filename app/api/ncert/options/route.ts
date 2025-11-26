import { NextResponse } from "next/server";
import { getNCERTLibraryOptions } from "@/lib/server/ncert-library";

export async function GET() {
  try {
    const options = await getNCERTLibraryOptions();
    return NextResponse.json(options);
  } catch (error) {
    console.error("Failed to load NCERT library options:", error);
    return NextResponse.json(
      { error: "Unable to load NCERT library options" },
      { status: 500 },
    );
  }
}


