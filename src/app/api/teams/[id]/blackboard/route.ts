import { NextRequest } from "next/server";
import { readAllBlackboard, writeBlackboard, deleteBlackboardKey } from "@/lib/blackboard";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const entries = readAllBlackboard(teamId);
  return Response.json(entries);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const body = await req.json();
  const { key, value, updatedBy } = body;

  if (!key || typeof key !== "string") {
    return Response.json({ error: "key is required" }, { status: 400 });
  }

  const entry = writeBlackboard({
    key,
    value: value ?? null,
    updatedBy: updatedBy || "api",
    teamId,
  });

  return Response.json(entry);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return Response.json({ error: "key query parameter required" }, { status: 400 });
  }

  const deleted = deleteBlackboardKey(key, teamId);
  return Response.json({ deleted });
}
