import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/agent-registry";
import { getAgentLogs } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);

  if (!agent) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  const logs = getAgentLogs(id);

  return NextResponse.json({
    id: agent.id,
    agentName: agent.agentName,
    displayName: agent.displayName,
    status: agent.status,
    runtime: agent.runtime,
    startedAt: agent.startedAt,
    lastActivity: agent.lastActivity,
    sessionId: agent.sessionId,
    error: agent.error,
    recentLogs: logs.slice(-20),
  });
}
