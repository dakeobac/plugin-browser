import { getObservatoryStats } from "@/lib/observatory-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = getObservatoryStats();
  return Response.json(stats);
}
