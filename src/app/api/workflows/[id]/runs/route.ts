import { NextRequest } from "next/server";
import { listWorkflowRuns } from "@/lib/workflow-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const runs = listWorkflowRuns(id);
  return Response.json(runs);
}
