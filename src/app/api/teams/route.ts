import { NextRequest } from "next/server";
import { listTeams, createTeam } from "@/lib/team-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const teams = listTeams();
  return Response.json(teams);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, supervisorId, members } = body;

  if (!name || typeof name !== "string") {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const team = createTeam({
    name,
    description: description || "",
    supervisorId,
    members: members || [],
  });

  return Response.json(team, { status: 201 });
}
