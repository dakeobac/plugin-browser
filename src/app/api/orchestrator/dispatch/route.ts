import { NextRequest, NextResponse } from "next/server";
import { createAgent, updateAgentStatus } from "@/lib/agent-registry";
import { launchAgent } from "@/lib/agent-launcher";
import { publishEvent } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, prompt, cwd, systemPrompt } = body;

  if (!name || !prompt) {
    return NextResponse.json(
      { error: "name and prompt are required" },
      { status: 400 }
    );
  }

  const workerName = `worker-${name}`;
  const agent = createAgent({
    agentName: workerName,
    displayName: `Worker: ${name}`,
    config: {
      runtime: "claude-code",
      cwd: cwd || process.cwd(),
      systemPrompt,
      permissionMode: "bypassPermissions",
    },
  });

  // Fire-and-forget — launch runs async, we return immediately
  const output: string[] = [];

  launchAgent(agent.id, prompt, (event) => {
    // Capture text output for the completion event
    if (event.type === "assistant") {
      const msg = event.message as Record<string, unknown> | undefined;
      const content = msg?.content as Array<Record<string, unknown>> | undefined;
      if (content) {
        for (const block of content) {
          if (block.type === "text" && typeof block.text === "string") {
            output.push(block.text);
          }
        }
      }
    }

    if (event.type === "done") {
      const currentAgent = updateAgentStatus(agent.id, "idle");
      const finalOutput = output.join("\n").slice(0, 2000);

      if (currentAgent?.status === "error" || currentAgent?.error) {
        publishEvent({
          type: "worker.failed",
          source: "orchestrator",
          payload: {
            agentId: agent.id,
            name: workerName,
            error: currentAgent.error || "Unknown error",
          },
        });
      } else {
        publishEvent({
          type: "worker.completed",
          source: "orchestrator",
          payload: {
            agentId: agent.id,
            name: workerName,
            output: finalOutput,
          },
        });
      }
    }
  }).catch((err) => {
    updateAgentStatus(agent.id, "error", { error: (err as Error).message });
    publishEvent({
      type: "worker.failed",
      source: "orchestrator",
      payload: {
        agentId: agent.id,
        name: workerName,
        error: (err as Error).message,
      },
    });
  });

  return NextResponse.json({
    agentId: agent.id,
    status: "dispatched",
  });
}
