import { NextRequest } from "next/server";
import { listWorkflows, createWorkflow } from "@/lib/workflow-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const workflows = listWorkflows();
  return Response.json(workflows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, trigger, steps } = body;

  if (!name || typeof name !== "string") {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const workflow = createWorkflow({
    name,
    description: description || "",
    trigger: trigger || { type: "manual" },
    steps: steps || [],
  });

  return Response.json(workflow, { status: 201 });
}
