import getDb from "./db";
import { getRecentLogs } from "./log-store";
import { getDailyCosts, getTotalCost } from "./cost-tracker";
import type { ObservatoryStats } from "./types";

export function getObservatoryStats(days = 30): ObservatoryStats {
  const db = getDb();

  const totalTraces = (db.prepare("SELECT COUNT(*) as count FROM traces").get() as { count: number }).count;

  const activeAgents = (db.prepare(
    "SELECT COUNT(DISTINCT agent_id) as count FROM traces WHERE status = 'running'"
  ).get() as { count: number }).count;

  const totalCost = getTotalCost();

  const totalTokens = (db.prepare(
    "SELECT COALESCE(SUM(total_tokens), 0) as total FROM cost_daily"
  ).get() as { total: number }).total;

  const errorCount = (db.prepare(
    "SELECT COUNT(*) as count FROM traces WHERE status = 'error'"
  ).get() as { count: number }).count;
  const errorRate = totalTraces > 0 ? errorCount / totalTraces : 0;

  const recentActivity = getRecentLogs(20);
  const costByDay = getDailyCosts(days);

  const tracesByAgent = db.prepare(`
    SELECT agent_id, agent_name, COUNT(*) as count
    FROM traces
    GROUP BY agent_id
    ORDER BY count DESC
    LIMIT 10
  `).all() as { agent_id: string; agent_name: string; count: number }[];

  return {
    totalTraces,
    activeAgents,
    totalCost,
    totalTokens,
    errorRate,
    recentActivity,
    costByDay,
    tracesByAgent: tracesByAgent.map((r) => ({
      agentId: r.agent_id,
      agentName: r.agent_name || r.agent_id,
      count: r.count,
    })),
  };
}
