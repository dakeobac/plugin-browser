import { NextRequest } from "next/server";
import { createOpenCodeSession, streamOpenCodePrompt } from "@/lib/opencode-process";
import { saveSession } from "@/lib/session-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, directory } = body;

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
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

      send({ type: "status", message: "Starting OpenCode..." });

      (async () => {
        try {
          // Create a new session
          const { sessionID } = await createOpenCodeSession(cwd);
          send({ type: "system", session_id: sessionID, subtype: "session_created" });

          // Save session metadata
          saveSession({
            id: sessionID,
            title: `Session ${new Date().toLocaleTimeString()}`,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            platform: "opencode",
          });

          // Stream the prompt response
          await streamOpenCodePrompt(sessionID, cwd, prompt, send);
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
