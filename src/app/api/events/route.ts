import { NextRequest, NextResponse } from "next/server";
import { matchEvents, consumeEvent } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const type = url.searchParams.get("type") || "worker.%";
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  const events = matchEvents(type, limit);
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { eventId } = body;

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  consumeEvent(eventId);
  return NextResponse.json({ ok: true });
}
