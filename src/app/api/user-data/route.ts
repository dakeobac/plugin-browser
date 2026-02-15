import { NextRequest, NextResponse } from "next/server";
import { getUserData, saveUserData } from "@/lib/user-data";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const data = getUserData(slug);
  return NextResponse.json(data || {});
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, rating, note } = body;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  if (rating !== undefined && (typeof rating !== "number" || rating < 0 || rating > 5)) {
    return NextResponse.json({ error: "rating must be 0-5" }, { status: 400 });
  }

  if (note !== undefined && typeof note !== "string") {
    return NextResponse.json({ error: "note must be string" }, { status: 400 });
  }

  const data: { rating?: number; note?: string } = {};
  if (rating !== undefined) data.rating = rating;
  if (note !== undefined) data.note = note;

  const updated = saveUserData(slug, data);
  return NextResponse.json(updated);
}
