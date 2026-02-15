import { NextRequest } from "next/server";
import { loadSessions, saveSession, deleteSession } from "@/lib/session-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = loadSessions();
  return Response.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, session } = body;

  if (action === "save" && session) {
    saveSession(session);
    return Response.json({ success: true });
  }

  if (action === "delete" && session?.id) {
    deleteSession(session.id);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
