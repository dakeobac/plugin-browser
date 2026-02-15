import getDb from "./db";
import type { CostSummary } from "./types";

export function recordTokenUsage(opts: {
  agentId: string;
  runtime: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}): void {
  const db = getDb();
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const totalTokens = opts.inputTokens + opts.outputTokens;

  db.prepare(`
    INSERT INTO cost_daily (date, agent_id, runtime, total_tokens, input_tokens, output_tokens, total_cost, trace_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT (date, agent_id, runtime) DO UPDATE SET
      total_tokens = total_tokens + excluded.total_tokens,
      input_tokens = input_tokens + excluded.input_tokens,
      output_tokens = output_tokens + excluded.output_tokens,
      total_cost = total_cost + excluded.total_cost,
      trace_count = trace_count + 1
  `).run(date, opts.agentId, opts.runtime, totalTokens, opts.inputTokens, opts.outputTokens, opts.cost);
}

export function getDailyCosts(days = 30): CostSummary[] {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const rows = db.prepare(`
    SELECT * FROM cost_daily WHERE date >= ? ORDER BY date DESC
  `).all(sinceStr) as Record<string, unknown>[];

  return rows.map(rowToCost);
}

export function getCostByAgent(): { agentId: string; runtime: string; totalCost: number; totalTokens: number }[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT agent_id, runtime, SUM(total_cost) as total_cost, SUM(total_tokens) as total_tokens
    FROM cost_daily
    GROUP BY agent_id, runtime
    ORDER BY total_cost DESC
  `).all() as Record<string, unknown>[];

  return rows.map((row) => ({
    agentId: row.agent_id as string,
    runtime: row.runtime as string,
    totalCost: row.total_cost as number,
    totalTokens: row.total_tokens as number,
  }));
}

export function getTotalCost(): number {
  const db = getDb();
  const row = db.prepare("SELECT COALESCE(SUM(total_cost), 0) as total FROM cost_daily").get() as { total: number };
  return row.total;
}

function rowToCost(row: Record<string, unknown>): CostSummary {
  return {
    date: row.date as string,
    agentId: row.agent_id as string,
    runtime: row.runtime as CostSummary["runtime"],
    totalTokens: row.total_tokens as number,
    inputTokens: row.input_tokens as number,
    outputTokens: row.output_tokens as number,
    totalCost: row.total_cost as number,
    traceCount: row.trace_count as number,
  };
}
