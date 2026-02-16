import fs from "fs";
import path from "path";
import os from "os";
import type { AgentInstance, AgentInstanceSummary, AgentConfig, AgentStatus } from "./types";

const PERSIST_FILE = path.join(os.homedir(), ".claude", "engram-agents.json");

// globalThis guard for HMR survival
const globalKey = "__agentRegistry";
type Registry = Map<string, AgentInstance>;

function getRegistry(): Registry {
  const g = globalThis as unknown as Record<string, Registry>;
  if (!g[globalKey]) {
    g[globalKey] = new Map();
    // Load from disk on first access
    try {
      const data = fs.readFileSync(PERSIST_FILE, "utf-8");
      const agents: AgentInstance[] = JSON.parse(data);
      for (const agent of agents) {
        // Mark stale "running" agents as terminated on restart
        if (agent.status === "running" || agent.status === "paused") {
          agent.status = "terminated";
          agent.error = "Process lost on server restart";
        }
        g[globalKey].set(agent.id, agent);
      }
    } catch {
      // File doesn't exist or is malformed — start fresh
    }
  }
  return g[globalKey];
}

function persist(): void {
  const registry = getRegistry();
  const agents = Array.from(registry.values());
  try {
    fs.mkdirSync(path.dirname(PERSIST_FILE), { recursive: true });
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(agents, null, 2));
  } catch (err) {
    console.error("[AgentRegistry] Failed to persist:", err);
  }
}

function generateId(): string {
  return `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getAllAgents(): AgentInstanceSummary[] {
  const registry = getRegistry();
  return Array.from(registry.values()).map((a) => ({
    id: a.id,
    agentName: a.agentName,
    displayName: a.displayName,
    status: a.status,
    runtime: a.runtime,
    pluginSlug: a.pluginSlug,
    startedAt: a.startedAt,
    lastActivity: a.lastActivity,
  }));
}

export function getAgent(id: string): AgentInstance | undefined {
  return getRegistry().get(id);
}

export function createAgent(opts: {
  agentName: string;
  displayName: string;
  config: AgentConfig;
  pluginSlug?: string;
}): AgentInstance {
  const agent: AgentInstance = {
    id: generateId(),
    agentName: opts.agentName,
    displayName: opts.displayName,
    status: "idle",
    runtime: opts.config.runtime,
    config: opts.config,
    pluginSlug: opts.pluginSlug,
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
  getRegistry().set(agent.id, agent);
  persist();
  return agent;
}

export function updateAgentStatus(
  id: string,
  status: AgentStatus,
  extra?: Partial<Pick<AgentInstance, "sessionId" | "error" | "lastActivity">>,
): AgentInstance | undefined {
  const agent = getRegistry().get(id);
  if (!agent) return undefined;
  agent.status = status;
  agent.lastActivity = new Date().toISOString();
  if (extra?.sessionId !== undefined) agent.sessionId = extra.sessionId;
  if (extra?.error !== undefined) agent.error = extra.error;
  if (extra?.lastActivity !== undefined) agent.lastActivity = extra.lastActivity;
  persist();
  return agent;
}

export function removeAgent(id: string): boolean {
  const registry = getRegistry();
  const removed = registry.delete(id);
  if (removed) persist();
  return removed;
}
