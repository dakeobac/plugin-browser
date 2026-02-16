import { NextRequest } from "next/server";
import { queryLogs } from "@/lib/log-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const source = params.get("source") || undefined;
  const sourceId = params.get("sourceId") || undefined;
  const level = params.get("level") || undefined;
  const limit = parseInt(params.get("limit") || "100");
  const offset = parseInt(params.get("offset") || "0");

  const logs = queryLogs({ source, sourceId, level, limit, offset });
  return Response.json(logs);
}
