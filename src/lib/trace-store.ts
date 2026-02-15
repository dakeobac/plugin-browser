import getDb from "./db";
import type { AgentTrace, TraceSpan, ClaudeEvent } from "./types";

function generateId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTrace(opts: {
  agentId: string;
  agentName?: string;
  runtime: string;
  promptPreview?: string;
}): AgentTrace {
  const db = getDb();
  const traceId = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO traces (trace_id, agent_id, agent_name, runtime, prompt_preview, started_at, status)
    VALUES (?, ?, ?, ?, ?, ?, 'running')
  `).run(traceId, opts.agentId, opts.agentName || null, opts.runtime, opts.promptPreview || null, now);

  return {
    traceId,
    agentId: opts.agentId,
    agentName: opts.agentName,
    runtime: opts.runtime as AgentTrace["runtime"],
    promptPreview: opts.promptPreview,
    startedAt: now,
    status: "running",
  };
}

export function updateTrace(traceId: string, updates: Partial<AgentTrace>): void {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.completedAt !== undefined) { sets.push("completed_at = ?"); values.push(updates.completedAt); }
  if (updates.status !== undefined) { sets.push("status = ?"); values.push(updates.status); }
  if (updates.totalTokens !== undefined) { sets.push("total_tokens = ?"); values.push(updates.totalTokens); }
  if (updates.inputTokens !== undefined) { sets.push("input_tokens = ?"); values.push(updates.inputTokens); }
  if (updates.outputTokens !== undefined) { sets.push("output_tokens = ?"); values.push(updates.outputTokens); }
  if (updates.totalCost !== undefined) { sets.push("total_cost = ?"); values.push(updates.totalCost); }
  if (updates.error !== undefined) { sets.push("error = ?"); values.push(updates.error); }

  if (sets.length === 0) return;
  values.push(traceId);
  db.prepare(`UPDATE traces SET ${sets.join(", ")} WHERE trace_id = ?`).run(...values);
}

export function getTrace(traceId: string): AgentTrace | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM traces WHERE trace_id = ?").get(traceId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return rowToTrace(row);
}

export function listTraces(opts?: {
  agentId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): AgentTrace[] {
  const db = getDb();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (opts?.agentId) { conditions.push("agent_id = ?"); values.push(opts.agentId); }
  if (opts?.status) { conditions.push("status = ?"); values.push(opts.status); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = opts?.limit || 50;
  const offset = opts?.offset || 0;
  values.push(limit, offset);

  const rows = db.prepare(`SELECT * FROM traces ${where} ORDER BY started_at DESC LIMIT ? OFFSET ?`).all(...values) as Record<string, unknown>[];
  return rows.map(rowToTrace);
}

export function addSpan(opts: {
  traceId: string;
  name: string;
  spanType?: string;
  parentSpanId?: string;
}): TraceSpan {
  const db = getDb();
  const spanId = `span-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO spans (span_id, trace_id, parent_span_id, name, span_type, started_at, duration_ms, status)
    VALUES (?, ?, ?, ?, ?, ?, 0, 'running')
  `).run(spanId, opts.traceId, opts.parentSpanId || null, opts.name, opts.spanType || null, now);

  return {
    spanId,
    traceId: opts.traceId,
    parentSpanId: opts.parentSpanId,
    name: opts.name,
    spanType: opts.spanType,
    startedAt: now,
    durationMs: 0,
    status: "running",
  };
}

export function completeSpan(spanId: string, durationMs: number, status: "completed" | "error" = "completed", error?: string): void {
  const db = getDb();
  db.prepare("UPDATE spans SET duration_ms = ?, status = ?, error = ? WHERE span_id = ?")
    .run(durationMs, status, error || null, spanId);
}

export function getSpans(traceId: string): TraceSpan[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM spans WHERE trace_id = ? ORDER BY started_at").all(traceId) as Record<string, unknown>[];
  return rows.map(rowToSpan);
}

/**
 * Wrap an SSE send function with trace logging.
 * Records events as spans within a trace.
 */
export function instrumentSend(
  traceId: string,
  originalSend: (data: unknown) => void,
): (data: unknown) => void {
  return (data: unknown) => {
    const event = data as ClaudeEvent;
    if (event.type === "assistant") {
      addSpan({ traceId, name: "assistant_message", spanType: "llm" });
    } else if (event.type === "done") {
      updateTrace(traceId, {
        completedAt: new Date().toISOString(),
        status: "completed",
      });
    } else if (event.type === "error") {
      updateTrace(traceId, {
        completedAt: new Date().toISOString(),
        status: "error",
        error: (event as { message?: string }).message,
      });
    }
    originalSend(data);
  };
}

function rowToTrace(row: Record<string, unknown>): AgentTrace {
  return {
    traceId: row.trace_id as string,
    agentId: row.agent_id as string,
    agentName: row.agent_name as string | undefined,
    runtime: row.runtime as AgentTrace["runtime"],
    promptPreview: row.prompt_preview as string | undefined,
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string | undefined,
    status: row.status as AgentTrace["status"],
    totalTokens: row.total_tokens as number | undefined,
    inputTokens: row.input_tokens as number | undefined,
    outputTokens: row.output_tokens as number | undefined,
    totalCost: row.total_cost as number | undefined,
    error: row.error as string | undefined,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
  };
}

function rowToSpan(row: Record<string, unknown>): TraceSpan {
  return {
    spanId: row.span_id as string,
    traceId: row.trace_id as string,
    parentSpanId: row.parent_span_id as string | undefined,
    name: row.name as string,
    spanType: row.span_type as string | undefined,
    startedAt: row.started_at as string,
    durationMs: row.duration_ms as number,
    status: row.status as TraceSpan["status"],
    error: row.error as string | undefined,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
  };
}
