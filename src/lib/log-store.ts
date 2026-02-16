import getDb from "./db";
import type { LogEntry } from "./types";

export function insertLog(opts: {
  level: LogEntry["level"];
  source: string;
  sourceId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO logs (timestamp, level, source, source_id, message, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    new Date().toISOString(),
    opts.level,
    opts.source,
    opts.sourceId || null,
    opts.message,
    opts.metadata ? JSON.stringify(opts.metadata) : null,
  );
}

export function queryLogs(opts?: {
  source?: string;
  sourceId?: string;
  level?: string;
  limit?: number;
  offset?: number;
}): LogEntry[] {
  const db = getDb();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (opts?.source) { conditions.push("source = ?"); values.push(opts.source); }
  if (opts?.sourceId) { conditions.push("source_id = ?"); values.push(opts.sourceId); }
  if (opts?.level) { conditions.push("level = ?"); values.push(opts.level); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = opts?.limit || 100;
  const offset = opts?.offset || 0;
  values.push(limit, offset);

  const rows = db.prepare(`SELECT * FROM logs ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(...values) as Record<string, unknown>[];
  return rows.map(rowToLog);
}

export function getRecentLogs(limit = 50): LogEntry[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?").all(limit) as Record<string, unknown>[];
  return rows.map(rowToLog);
}

function rowToLog(row: Record<string, unknown>): LogEntry {
  return {
    id: row.id as number,
    timestamp: row.timestamp as string,
    level: row.level as LogEntry["level"],
    source: row.source as string,
    sourceId: row.source_id as string | undefined,
    message: row.message as string,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
  };
}
