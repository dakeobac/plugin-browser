import { NextRequest } from "next/server";
import { listTraces } from "@/lib/trace-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const agentId = params.get("agentId") || undefined;
  const status = params.get("status") || undefined;
  const limit = parseInt(params.get("limit") || "50");
  const offset = parseInt(params.get("offset") || "0");

  const traces = listTraces({ agentId, status, limit, offset });
  return Response.json(traces);
}
