import { NextRequest } from "next/server";
import { getTrace, getSpans } from "@/lib/trace-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ traceId: string }> },
) {
  const { traceId } = await params;
  const trace = getTrace(traceId);
  if (!trace) {
    return Response.json({ error: "Trace not found" }, { status: 404 });
  }
  const spans = getSpans(traceId);
  return Response.json({ ...trace, spans });
}
