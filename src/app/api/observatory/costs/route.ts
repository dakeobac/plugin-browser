import { NextRequest } from "next/server";
import { getDailyCosts, getCostByAgent, getTotalCost } from "@/lib/cost-tracker";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const days = parseInt(params.get("days") || "30");

  return Response.json({
    daily: getDailyCosts(days),
    byAgent: getCostByAgent(),
    total: getTotalCost(),
  });
}
