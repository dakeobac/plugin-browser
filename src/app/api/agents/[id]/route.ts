import { NextRequest } from "next/server";
import { getAgent, removeAgent } from "@/lib/agent-registry";
import { stopAgent } from "@/lib/agent-launcher";
import { getAgentLogs, clearAgentLogs } from "@/lib/agent-logger";

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
  const logs = getAgentLogs(id);
  return Response.json({ ...agent, logs });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.status === "running") {
    await stopAgent(id);
  }
  clearAgentLogs(id);
  removeAgent(id);
  return Response.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action: string };

  const agent = getAgent(id);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  switch (action) {
    case "stop":
      await stopAgent(id);
      return Response.json({ success: true, status: "terminated" });
    default:
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
