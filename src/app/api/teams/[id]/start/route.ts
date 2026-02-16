import { NextRequest } from "next/server";
import { getTeam } from "@/lib/team-store";
import { startTeam } from "@/lib/agent-supervisor";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const team = getTeam(id);
  if (!team) {
    return Response.json({ error: "Team not found" }, { status: 404 });
  }

  const body = await req.json();
  const { prompt } = body;

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

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

      (async () => {
        try {
          await startTeam(id, prompt, send);
        } catch (err) {
          send({ type: "error", message: (err as Error).message });
        } finally {
          send({ type: "done" });
          closed = true;
          try { controller.close(); } catch { /* already closed */ }
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
