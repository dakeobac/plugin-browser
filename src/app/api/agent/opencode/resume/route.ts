import { NextRequest } from "next/server";
import { streamOpenCodePrompt } from "@/lib/opencode-process";
import { saveSession, loadSessions } from "@/lib/session-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, message, directory } = body;

  if (!sessionId || typeof sessionId !== "string") {
    return new Response(JSON.stringify({ error: "sessionId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cwd = directory || process.cwd();

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

      send({ type: "status", message: "Resuming OpenCode session..." });

      (async () => {
        try {
          // Update session lastUsedAt
          const sessions = loadSessions();
          const existing = sessions.find((s) => s.id === sessionId);
          if (existing) {
            saveSession({ ...existing, lastUsedAt: new Date().toISOString() });
          }

          // Stream the prompt response
          await streamOpenCodePrompt(sessionId, cwd, message, send);
        } catch (err) {
          console.error("[OpenCode SSE] Error:", err);
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
