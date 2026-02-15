import fs from "fs";
import path from "path";
import os from "os";
import type { SessionMeta } from "./types";

const SESSION_FILE = path.join(
  os.homedir(),
  ".claude",
  "plugin-browser-sessions.json"
);

export function loadSessions(): SessionMeta[] {
  try {
    const data = fs.readFileSync(SESSION_FILE, "utf-8");
    return JSON.parse(data) as SessionMeta[];
  } catch {
    return [];
  }
}

export function saveSession(session: SessionMeta): void {
  const sessions = loadSessions();
  const existing = sessions.findIndex((s) => s.id === session.id);
  if (existing >= 0) {
    sessions[existing] = session;
  } else {
    sessions.unshift(session);
  }
  // Keep last 50 sessions
  const trimmed = sessions.slice(0, 50);
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify(trimmed, null, 2));
}

export function deleteSession(id: string): void {
  const sessions = loadSessions().filter((s) => s.id !== id);
  fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
}
