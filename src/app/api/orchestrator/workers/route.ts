import { NextResponse } from "next/server";
import { getAllAgents } from "@/lib/agent-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = getAllAgents();
  const workers = all.filter((a) => a.agentName.startsWith("worker-"));
  return NextResponse.json(workers);
}
