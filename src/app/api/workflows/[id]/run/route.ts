import { NextRequest } from "next/server";
import { getWorkflow } from "@/lib/workflow-store";
import { executeWorkflow } from "@/lib/workflow-engine";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workflow = getWorkflow(id);
  if (!workflow) {
    return Response.json({ error: "Workflow not found" }, { status: 404 });
  }

  if (workflow.steps.length === 0) {
    return Response.json({ error: "Workflow has no steps" }, { status: 400 });
  }

  // Execute asynchronously — return run ID immediately
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(data: unknown) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* stream closed */
        }
      }

      send({ type: "status", message: `Starting workflow: ${workflow.name}` });

      executeWorkflow(workflow).then((run) => {
        send({ type: "workflow_run", run });
        send({ type: "done" });
        try { controller.close(); } catch { /* already closed */ }
      }).catch((err) => {
        send({ type: "error", message: (err as Error).message });
        send({ type: "done" });
        try { controller.close(); } catch { /* already closed */ }
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
