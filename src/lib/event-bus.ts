import getDb from "./db";
import type { BusEvent } from "./types";

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function publishEvent(opts: {
  type: string;
  source: string;
  payload: Record<string, unknown>;
}): BusEvent {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO events (id, type, source, timestamp, payload, consumed)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(id, opts.type, opts.source, now, JSON.stringify(opts.payload));

  return {
    id,
    type: opts.type,
    source: opts.source,
    timestamp: now,
    payload: opts.payload,
    consumed: false,
  };
}

export function checkEvents(opts?: {
  type?: string;
  source?: string;
  unconsumedOnly?: boolean;
  limit?: number;
}): BusEvent[] {
  const db = getDb();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (opts?.type) {
    conditions.push("type = ?");
    values.push(opts.type);
  }
  if (opts?.source) {
    conditions.push("source = ?");
    values.push(opts.source);
  }
  if (opts?.unconsumedOnly !== false) {
    conditions.push("consumed = 0");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = opts?.limit || 50;
  values.push(limit);

  const rows = db.prepare(
    `SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT ?`
  ).all(...values) as Record<string, unknown>[];

  return rows.map(rowToEvent);
}

export function consumeEvent(id: string): void {
  const db = getDb();
  db.prepare("UPDATE events SET consumed = 1 WHERE id = ?").run(id);
}

export function getEvent(id: string): BusEvent | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return rowToEvent(row);
}

export function matchEvents(pattern: string, limit = 20): BusEvent[] {
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM events WHERE type LIKE ? AND consumed = 0 ORDER BY timestamp DESC LIMIT ?"
  ).all(pattern.replace("*", "%"), limit) as Record<string, unknown>[];
  return rows.map(rowToEvent);
}

function rowToEvent(row: Record<string, unknown>): BusEvent {
  return {
    id: row.id as string,
    type: row.type as string,
    source: row.source as string,
    timestamp: row.timestamp as string,
    payload: JSON.parse(row.payload as string),
    consumed: (row.consumed as number) === 1,
  };
}
