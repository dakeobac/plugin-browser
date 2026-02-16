import getDb from "./db";
import type { Team, TeamMember } from "./types";

function generateId(): string {
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTeam(opts: {
  name: string;
  description: string;
  supervisorId?: string;
  members: TeamMember[];
}): Team {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO teams (id, name, description, supervisor_id, members, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'idle', ?)
  `).run(id, opts.name, opts.description, opts.supervisorId || null, JSON.stringify(opts.members), now);

  return {
    id,
    name: opts.name,
    description: opts.description,
    supervisorId: opts.supervisorId,
    members: opts.members,
    status: "idle",
    createdAt: now,
  };
}

export function getTeam(id: string): Team | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM teams WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return rowToTeam(row);
}

export function listTeams(): Team[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM teams ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToTeam);
}

export function updateTeam(id: string, updates: Partial<Pick<Team, "name" | "description" | "supervisorId" | "members" | "status">>): Team | undefined {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) { sets.push("name = ?"); values.push(updates.name); }
  if (updates.description !== undefined) { sets.push("description = ?"); values.push(updates.description); }
  if (updates.supervisorId !== undefined) { sets.push("supervisor_id = ?"); values.push(updates.supervisorId); }
  if (updates.members !== undefined) { sets.push("members = ?"); values.push(JSON.stringify(updates.members)); }
  if (updates.status !== undefined) { sets.push("status = ?"); values.push(updates.status); }

  if (sets.length === 0) return getTeam(id);
  values.push(id);
  db.prepare(`UPDATE teams SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getTeam(id);
}

export function deleteTeam(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM teams WHERE id = ?").run(id);
  return result.changes > 0;
}

function rowToTeam(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    supervisorId: row.supervisor_id as string | undefined,
    members: JSON.parse(row.members as string),
    status: row.status as Team["status"],
    createdAt: row.created_at as string,
  };
}
