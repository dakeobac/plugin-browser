import { startAgent, type AgentHandle } from "./claude-process";
import { streamOpenCodePrompt, createOpenCodeSession } from "./opencode-process";
import { updateAgentStatus, getAgent } from "./agent-registry";
import { logAgent } from "./agent-logger";
import type { ClaudeEvent } from "./types";

// Active process handles — keyed by agent ID
const globalKey = "__agentHandles";
type HandleMap = Map<string, AgentHandle>;

function getHandles(): HandleMap {
  const g = globalThis as unknown as Record<string, HandleMap>;
  if (!g[globalKey]) {
    g[globalKey] = new Map();
  }
  return g[globalKey];
}

/**
 * Launch an agent and stream events via the `send` callback.
 * Updates agent registry status throughout the lifecycle.
 */
export async function launchAgent(
  agentId: string,
  prompt: string,
  send: (event: ClaudeEvent) => void,
): Promise<void> {
  const agent = getAgent(agentId);
  if (!agent) {
    send({ type: "error", message: "Agent not found" });
    send({ type: "done" });
    return;
  }

  const { config } = agent;
  logAgent(agentId, "info", "Launching agent", { runtime: config.runtime, prompt: prompt.slice(0, 100) });
  updateAgentStatus(agentId, "running");

  try {
    if (config.runtime === "opencode") {
      await launchOpenCode(agentId, prompt, send);
    } else {
      await launchClaudeCode(agentId, prompt, send);
    }
  } catch (err) {
    const message = (err as Error).message;
    logAgent(agentId, "error", "Agent failed", { error: message });
    updateAgentStatus(agentId, "error", { error: message });
    send({ type: "error", message });
    send({ type: "done" });
  }
}

async function launchClaudeCode(
  agentId: string,
  prompt: string,
  send: (event: ClaudeEvent) => void,
): Promise<void> {
  const agent = getAgent(agentId)!;
  const { config } = agent;

  const handle = startAgent({
    prompt,
    cwd: config.cwd,
    systemPrompt: config.systemPrompt,
    maxTurns: config.maxTurns,
    permissionMode: config.permissionMode,
    resumeSessionId: agent.sessionId,
  });

  getHandles().set(agentId, handle);

  send({ type: "status", message: "Starting Claude Code agent..." });

  try {
    for await (const message of handle.messages) {
      const msg = message as ClaudeEvent;

      // Capture session ID
      if ("session_id" in msg && msg.session_id && !agent.sessionId) {
        updateAgentStatus(agentId, "running", { sessionId: msg.session_id });
      }

      logAgent(agentId, "debug", `Event: ${msg.type}`);
      updateAgentStatus(agentId, "running", { lastActivity: new Date().toISOString() });
      send(msg);
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      throw err;
    }
  } finally {
    getHandles().delete(agentId);
    const current = getAgent(agentId);
    if (current && current.status === "running") {
      updateAgentStatus(agentId, "idle");
    }
    logAgent(agentId, "info", "Agent run completed");
    send({ type: "done" });
  }
}

async function launchOpenCode(
  agentId: string,
  prompt: string,
  send: (event: ClaudeEvent) => void,
): Promise<void> {
  const agent = getAgent(agentId)!;
  const { config } = agent;
  const directory = config.cwd || process.cwd();

  // Create session if needed
  let sessionId = agent.sessionId;
  if (!sessionId) {
    const session = await createOpenCodeSession(directory, agent.displayName);
    sessionId = session.sessionID;
    updateAgentStatus(agentId, "running", { sessionId });
  }

  send({ type: "status", message: "Starting OpenCode agent..." });

  await streamOpenCodePrompt(sessionId, directory, prompt, (event) => {
    logAgent(agentId, "debug", `Event: ${event.type}`);
    updateAgentStatus(agentId, "running", { lastActivity: new Date().toISOString() });
    send(event);
  });

  const current = getAgent(agentId);
  if (current && current.status === "running") {
    updateAgentStatus(agentId, "idle");
  }
  logAgent(agentId, "info", "Agent run completed");
}

/**
 * Send a follow-up prompt to a running or idle agent.
 */
export async function promptAgent(
  agentId: string,
  message: string,
  send: (event: ClaudeEvent) => void,
): Promise<void> {
  const agent = getAgent(agentId);
  if (!agent) {
    send({ type: "error", message: "Agent not found" });
    send({ type: "done" });
    return;
  }

  if (!agent.sessionId) {
    send({ type: "error", message: "Agent has no active session" });
    send({ type: "done" });
    return;
  }

  logAgent(agentId, "info", "Prompting agent", { message: message.slice(0, 100) });
  updateAgentStatus(agentId, "running");

  try {
    if (agent.config.runtime === "opencode") {
      const directory = agent.config.cwd || process.cwd();
      send({ type: "status", message: "Resuming OpenCode session..." });
      await streamOpenCodePrompt(agent.sessionId, directory, message, (event) => {
        logAgent(agentId, "debug", `Event: ${event.type}`);
        send(event);
      });
    } else {
      const handle = startAgent({
        prompt: message,
        resumeSessionId: agent.sessionId,
      });
      getHandles().set(agentId, handle);

      send({ type: "status", message: "Resuming Claude Code session..." });

      try {
        for await (const msg of handle.messages) {
          logAgent(agentId, "debug", `Event: ${(msg as ClaudeEvent).type}`);
          send(msg as ClaudeEvent);
        }
      } finally {
        getHandles().delete(agentId);
      }
    }
  } catch (err) {
    const errMsg = (err as Error).message;
    logAgent(agentId, "error", "Prompt failed", { error: errMsg });
    updateAgentStatus(agentId, "error", { error: errMsg });
    send({ type: "error", message: errMsg });
  } finally {
    const current = getAgent(agentId);
    if (current && current.status === "running") {
      updateAgentStatus(agentId, "idle");
    }
    send({ type: "done" });
  }
}

/**
 * Stop a running agent by interrupting its process.
 */
export async function stopAgent(agentId: string): Promise<boolean> {
  const handles = getHandles();
  const handle = handles.get(agentId);
  if (handle) {
    try {
      await handle.interrupt();
    } catch {
      // Already stopped
    }
    handles.delete(agentId);
  }
  updateAgentStatus(agentId, "terminated");
  logAgent(agentId, "info", "Agent stopped");
  return true;
}
