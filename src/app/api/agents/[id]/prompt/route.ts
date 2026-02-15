import { NextRequest } from "next/server";
import { getAgent } from "@/lib/agent-registry";
import { promptAgent } from "@/lib/agent-launcher";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { message } = body as { message: string };

  if (!message || typeof message !== "string") {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const agent = getAgent(id);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
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

      promptAgent(id, message, send).finally(() => {
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
