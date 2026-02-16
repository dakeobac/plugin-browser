import getDb from "./db";
import type { BlackboardEntry } from "./types";

export function readBlackboard(key: string, teamId = "_global"): BlackboardEntry | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM blackboard WHERE key = ? AND team_id = ?").get(key, teamId) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return rowToEntry(row);
}

export function readAllBlackboard(teamId = "_global"): BlackboardEntry[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM blackboard WHERE team_id = ? ORDER BY updated_at DESC").all(teamId) as Record<string, unknown>[];
  return rows.map(rowToEntry);
}

export function writeBlackboard(opts: {
  key: string;
  value: unknown;
  updatedBy: string;
  teamId?: string;
}): BlackboardEntry {
  const db = getDb();
  const now = new Date().toISOString();
  const valueStr = JSON.stringify(opts.value);
  const teamId = opts.teamId || "_global";

  // UPSERT — increment version on update
  db.prepare(`
    INSERT INTO blackboard (key, team_id, value, updated_by, updated_at, version)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(key, team_id) DO UPDATE SET
      value = excluded.value,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at,
      version = blackboard.version + 1
  `).run(opts.key, teamId, valueStr, opts.updatedBy, now);

  const entry = readBlackboard(opts.key, teamId)!;
  return entry;
}

export function deleteBlackboardKey(key: string, teamId = "_global"): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM blackboard WHERE key = ? AND team_id = ?").run(key, teamId);
  return result.changes > 0;
}

export function clearBlackboard(teamId = "_global"): void {
  const db = getDb();
  db.prepare("DELETE FROM blackboard WHERE team_id = ?").run(teamId);
}

function rowToEntry(row: Record<string, unknown>): BlackboardEntry {
  return {
    key: row.key as string,
    value: JSON.parse(row.value as string),
    updatedBy: row.updated_by as string,
    updatedAt: row.updated_at as string,
    version: row.version as number,
    teamId: row.team_id as string,
  };
}
