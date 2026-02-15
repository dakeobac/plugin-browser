import type { AgentLogEntry } from "./types";

const MAX_ENTRIES = 500;

// globalThis guard for HMR survival
const globalKey = "__agentLogBuffers";
type LogBuffers = Map<string, AgentLogEntry[]>;

function getBuffers(): LogBuffers {
  const g = globalThis as unknown as Record<string, LogBuffers>;
  if (!g[globalKey]) {
    g[globalKey] = new Map();
  }
  return g[globalKey];
}

export function logAgent(
  agentId: string,
  level: AgentLogEntry["level"],
  message: string,
  data?: Record<string, unknown>,
): void {
  const buffers = getBuffers();
  if (!buffers.has(agentId)) {
    buffers.set(agentId, []);
  }
  const entries = buffers.get(agentId)!;
  entries.push({
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  });
  // Trim to ring buffer size
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
}

export function getAgentLogs(agentId: string): AgentLogEntry[] {
  return getBuffers().get(agentId) || [];
}

export function clearAgentLogs(agentId: string): void {
  getBuffers().delete(agentId);
}
