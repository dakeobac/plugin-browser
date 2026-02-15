import { handleJsonRpc } from "./team-server";
import { insertLog } from "./log-store";

/**
 * In-process team server manager.
 * Rather than spawning a child process, we handle MCP requests in-process.
 * This avoids child process complexity while maintaining the MCP interface.
 */

const globalKey = "__teamServerManager";

interface TeamServerState {
  running: boolean;
  agentId: string | null;
  startedAt: string | null;
  restartCount: number;
}

function getState(): TeamServerState {
  const g = globalThis as unknown as Record<string, TeamServerState>;
  if (!g[globalKey]) {
    g[globalKey] = {
      running: false,
      agentId: null,
      startedAt: null,
      restartCount: 0,
    };
  }
  return g[globalKey];
}

/**
 * Start the team server for a specific agent context.
 */
export function startTeamServer(agentId: string): void {
  const state = getState();
  state.running = true;
  state.agentId = agentId;
  state.startedAt = new Date().toISOString();

  insertLog({
    level: "info",
    source: "team-server-manager",
    sourceId: agentId,
    message: `Team server started for agent ${agentId}`,
  });
}

/**
 * Stop the team server.
 */
export function stopTeamServer(): void {
  const state = getState();
  state.running = false;
  state.agentId = null;

  insertLog({
    level: "info",
    source: "team-server-manager",
    message: "Team server stopped",
  });
}

/**
 * Check if team server is running.
 */
export function isTeamServerRunning(): boolean {
  return getState().running;
}

/**
 * Handle an MCP request through the team server.
 */
export function handleTeamRequest(method: string, params?: Record<string, unknown>) {
  const state = getState();
  if (!state.running || !state.agentId) {
    return { error: "Team server not running" };
  }

  const request = {
    jsonrpc: "2.0" as const,
    id: Date.now(),
    method,
    params,
  };

  return handleJsonRpc(state.agentId, request);
}

/**
 * Get team server status.
 */
export function getTeamServerStatus() {
  const state = getState();
  return {
    running: state.running,
    agentId: state.agentId,
    startedAt: state.startedAt,
    restartCount: state.restartCount,
  };
}
