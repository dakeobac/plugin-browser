import { NextRequest } from "next/server";
import { checkEvents, publishEvent } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const events = checkEvents({
    source: `team:${id}`,
    type,
    unconsumedOnly: false,
    limit,
  });

  return Response.json(events);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { type, payload } = body;

  if (!type || typeof type !== "string") {
    return Response.json({ error: "type is required" }, { status: 400 });
  }

  const event = publishEvent({
    type,
    source: `team:${id}`,
    payload: payload || {},
  });

  return Response.json(event, { status: 201 });
}
