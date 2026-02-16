import { NextRequest } from "next/server";
import { getAllAgents, createAgent } from "@/lib/agent-registry";
import { launchAgent } from "@/lib/agent-launcher";
import type { AgentConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = getAllAgents();
  return Response.json(agents);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    agentName,
    displayName,
    prompt,
    pluginSlug,
    runtime = "claude-code",
    cwd,
    systemPrompt,
    maxTurns,
    permissionMode,
    mcpServerIds,
  } = body as {
    agentName: string;
    displayName: string;
    prompt: string;
    pluginSlug?: string;
    runtime?: string;
    cwd?: string;
    systemPrompt?: string;
    maxTurns?: number;
    permissionMode?: string;
    mcpServerIds?: string[];
  };

  if (!agentName || !displayName || !prompt) {
    return Response.json(
      { error: "agentName, displayName, and prompt are required" },
      { status: 400 },
    );
  }

  // Convert MCP server IDs to refs
  const mcpServers = mcpServerIds?.map((id) => ({ id, name: id }));

  const config: AgentConfig = {
    runtime: runtime === "opencode" ? "opencode" : "claude-code",
    cwd,
    systemPrompt,
    maxTurns,
    permissionMode,
    mcpServers,
  };

  const agent = createAgent({ agentName, displayName, config, pluginSlug });

  // Stream agent events via SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      function send(data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* stream closed */
        }
      }

      // Send agent ID immediately so client can track
      send({ type: "agent_created", agentId: agent.id });

      launchAgent(agent.id, prompt, send).finally(() => {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
