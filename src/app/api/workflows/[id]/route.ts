import { NextRequest } from "next/server";
import { getWorkflow, updateWorkflow, deleteWorkflow } from "@/lib/workflow-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workflow = getWorkflow(id);
  if (!workflow) {
    return Response.json({ error: "Workflow not found" }, { status: 404 });
  }
  return Response.json(workflow);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const workflow = updateWorkflow(id, body);
  if (!workflow) {
    return Response.json({ error: "Workflow not found" }, { status: 404 });
  }
  return Response.json(workflow);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = deleteWorkflow(id);
  if (!deleted) {
    return Response.json({ error: "Workflow not found" }, { status: 404 });
  }
  return Response.json({ success: true });
}
