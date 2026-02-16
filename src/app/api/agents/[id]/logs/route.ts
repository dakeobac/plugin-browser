import { NextRequest } from "next/server";
import { getAgent } from "@/lib/agent-registry";
import { getAgentLogs } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }
  return Response.json(getAgentLogs(id));
}
