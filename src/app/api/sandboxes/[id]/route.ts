import { NextRequest } from "next/server";
import { getSandbox, destroySandbox, execInSandbox, isE2BAvailable } from "@/lib/e2b-sandbox";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sandbox = getSandbox(id);
  if (!sandbox) {
    return Response.json({ error: "Sandbox not found" }, { status: 404 });
  }
  return Response.json(sandbox);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isE2BAvailable()) {
    return Response.json({ error: "E2B not configured" }, { status: 503 });
  }

  const { id } = await params;
  const sandbox = getSandbox(id);
  if (!sandbox) {
    return Response.json({ error: "Sandbox not found" }, { status: 404 });
  }

  const body = await req.json();
  const { command } = body as { command: string };
  if (!command) {
    return Response.json({ error: "command is required" }, { status: 400 });
  }

  // Stream exec output via SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      function send(data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { /* closed */ }
      }

      (async () => {
        try {
          for await (const chunk of execInSandbox(sandbox.sandboxId, command)) {
            send(chunk);
          }
        } catch (err) {
          send({ type: "error", data: (err as Error).message });
        } finally {
          send({ type: "done", data: "" });
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
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isE2BAvailable()) {
    return Response.json({ error: "E2B not configured" }, { status: 503 });
  }

  const { id } = await params;
  const sandbox = getSandbox(id);
  if (!sandbox) {
    return Response.json({ error: "Sandbox not found" }, { status: 404 });
  }

  try {
    await destroySandbox(sandbox.sandboxId);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
