import { NextRequest } from "next/server";
import { getTeam, updateTeam, deleteTeam } from "@/lib/team-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const team = getTeam(id);
  if (!team) {
    return Response.json({ error: "Team not found" }, { status: 404 });
  }
  return Response.json(team);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const team = updateTeam(id, body);
  if (!team) {
    return Response.json({ error: "Team not found" }, { status: 404 });
  }
  return Response.json(team);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = deleteTeam(id);
  if (!deleted) {
    return Response.json({ error: "Team not found" }, { status: 404 });
  }
  return Response.json({ success: true });
}
