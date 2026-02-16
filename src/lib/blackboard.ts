import getDb from "./db";
import type { BlackboardEntry } from "./types";

export function readBlackboard(key: string): BlackboardEntry | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM blackboard WHERE key = ?").get(key) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return rowToEntry(row);
}

export function readAllBlackboard(): BlackboardEntry[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM blackboard ORDER BY updated_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToEntry);
}

export function writeBlackboard(opts: {
  key: string;
  value: unknown;
  updatedBy: string;
}): BlackboardEntry {
  const db = getDb();
  const now = new Date().toISOString();
  const valueStr = JSON.stringify(opts.value);

  // UPSERT — increment version on update
  db.prepare(`
    INSERT INTO blackboard (key, value, updated_by, updated_at, version)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at,
      version = blackboard.version + 1
  `).run(opts.key, valueStr, opts.updatedBy, now);

  const entry = readBlackboard(opts.key)!;
  return entry;
}

export function deleteBlackboardKey(key: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM blackboard WHERE key = ?").run(key);
  return result.changes > 0;
}

export function clearBlackboard(): void {
  const db = getDb();
  db.prepare("DELETE FROM blackboard").run();
}

function rowToEntry(row: Record<string, unknown>): BlackboardEntry {
  return {
    key: row.key as string,
    value: JSON.parse(row.value as string),
    updatedBy: row.updated_by as string,
    updatedAt: row.updated_at as string,
    version: row.version as number,
  };
}
