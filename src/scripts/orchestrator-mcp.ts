#!/usr/bin/env npx tsx
/**
 * Orchestrator MCP Server — stdio transport
 *
 * Provides 3 tools to the orchestrator Claude Code instance:
 * - dispatch_worker: spawn a background CC/OpenCode worker
 * - check_worker_status: query a specific worker's state
 * - list_workers: list all dispatched workers
 *
 * Communicates with the Engram API via HTTP (ENGRAM_URL env var).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ENGRAM_URL = process.env.ENGRAM_URL || "http://localhost:3000";

const server = new McpServer({
  name: "engram-orchestrator",
  version: "1.0.0",
});

server.tool(
  "dispatch_worker",
  "Spawn a background worker agent to run a task autonomously. The worker runs independently and you will be notified when it completes.",
  {
    name: z.string().describe("Short name for the worker (e.g. 'code-review', 'test-runner')"),
    prompt: z.string().describe("The prompt/task for the worker to execute"),
    cwd: z.string().optional().describe("Working directory for the worker (defaults to project root)"),
    systemPrompt: z.string().optional().describe("Optional system prompt to configure the worker's behavior"),
  },
  async ({ name, prompt, cwd, systemPrompt }) => {
    try {
      const res = await fetch(`${ENGRAM_URL}/api/orchestrator/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt, cwd, systemPrompt }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { content: [{ type: "text" as const, text: `Failed to dispatch worker: ${err}` }] };
      }
      const data = await res.json();
      return {
        content: [{
          type: "text" as const,
          text: `Worker dispatched successfully.\n\nAgent ID: ${data.agentId}\nName: worker-${name}\nStatus: ${data.status}\n\nThe worker is now running in the background. Use check_worker_status with the agent ID to monitor progress.`,
        }],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error dispatching worker: ${(err as Error).message}` }],
      };
    }
  }
);

server.tool(
  "check_worker_status",
  "Check the current status of a specific background worker by its agent ID.",
  {
    agentId: z.string().describe("The agent ID returned from dispatch_worker"),
  },
  async ({ agentId }) => {
    try {
      const res = await fetch(`${ENGRAM_URL}/api/orchestrator/workers/${agentId}`);
      if (!res.ok) {
        return { content: [{ type: "text" as const, text: `Worker not found: ${agentId}` }] };
      }
      const data = await res.json();
      const lines = [
        `Worker: ${data.displayName}`,
        `Status: ${data.status}`,
        `Runtime: ${data.runtime}`,
        `Started: ${data.startedAt || "unknown"}`,
        `Last Activity: ${data.lastActivity || "unknown"}`,
      ];
      if (data.error) lines.push(`Error: ${data.error}`);
      if (data.recentLogs?.length) {
        lines.push("", "Recent logs:");
        for (const log of data.recentLogs.slice(-5)) {
          lines.push(`  [${log.level}] ${log.message}`);
        }
      }
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error checking worker: ${(err as Error).message}` }],
      };
    }
  }
);

server.tool(
  "list_workers",
  "List all background workers that have been dispatched, with their current status.",
  {},
  async () => {
    try {
      const res = await fetch(`${ENGRAM_URL}/api/orchestrator/workers`);
      if (!res.ok) {
        return { content: [{ type: "text" as const, text: "Failed to list workers" }] };
      }
      const workers = await res.json();
      if (!workers.length) {
        return { content: [{ type: "text" as const, text: "No workers have been dispatched yet." }] };
      }
      const lines = [`${workers.length} worker(s):`, ""];
      for (const w of workers) {
        const status = w.status === "running" ? "RUNNING" : w.status === "idle" ? "COMPLETED" : w.status.toUpperCase();
        lines.push(`- ${w.displayName} (${w.id}) — ${status}`);
      }
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error listing workers: ${(err as Error).message}` }],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Orchestrator MCP server error:", err);
  process.exit(1);
});
