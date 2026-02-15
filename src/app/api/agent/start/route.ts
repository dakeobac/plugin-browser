import { NextRequest } from "next/server";
import { startAgent } from "@/lib/claude-process";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, cwd, systemPrompt, maxTurns, permissionMode } = body;

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const agent = startAgent({ prompt, cwd, systemPrompt, maxTurns, permissionMode });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      function send(data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* stream closed by client */
        }
      }

      send({ type: "status", message: "Starting Claude..." });

      (async () => {
        try {
          for await (const message of agent.messages) {
            console.log(`[Agent SSE] type=${(message as Record<string, unknown>).type}`);
            send(message);
          }
        } catch (err) {
          console.error("[Agent SSE] Error:", err);
          send({ type: "error", message: (err as Error).message });
        } finally {
          send({ type: "done" });
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      })();
    },
    cancel() {
      agent.interrupt();
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
