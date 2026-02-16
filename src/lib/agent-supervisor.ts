import type { Team, TeamMember } from "./types";
import { getTeam, updateTeam } from "./team-store";
import { getAgent, getAllAgents, createAgent } from "./agent-registry";
import { launchAgent, promptAgent } from "./agent-launcher";
import { publishEvent, checkEvents } from "./event-bus";
import { readBlackboard, writeBlackboard, readAllBlackboard } from "./blackboard";
import { insertLog } from "./log-store";
import type { ClaudeEvent } from "./types";

/**
 * Start a team session — sets all member agents to active
 * and launches the supervisor (if any) with a coordination prompt.
 */
export async function startTeam(
  teamId: string,
  initialPrompt: string,
  send: (event: ClaudeEvent) => void,
): Promise<void> {
  const team = getTeam(teamId);
  if (!team) {
    send({ type: "error", message: "Team not found" });
    send({ type: "done" });
    return;
  }

  updateTeam(teamId, { status: "active" });

  insertLog({
    level: "info",
    source: "supervisor",
    sourceId: teamId,
    message: `Starting team: ${team.name} with ${team.members.length} members`,
  });

  // Publish team start event
  publishEvent({
    type: "team.started",
    source: `team:${teamId}`,
    payload: {
      teamId,
      teamName: team.name,
      members: team.members.map((m) => m.agentId),
    },
  });

  // Build supervisor system prompt
  const memberDescriptions = team.members.map((m) => {
    const agent = getAgent(m.agentId);
    return `- ${agent?.displayName || m.agentId} (role: ${m.role}, capabilities: ${m.capabilities.join(", ")})`;
  }).join("\n");

  const supervisorPrompt = buildSupervisorPrompt(team, memberDescriptions, initialPrompt);

  // Launch supervisor agent (or first member if no supervisor)
  const supervisorAgentId = team.supervisorId || team.members[0]?.agentId;
  if (!supervisorAgentId) {
    send({ type: "error", message: "Team has no supervisor or members" });
    send({ type: "done" });
    return;
  }

  let agent = getAgent(supervisorAgentId);
  if (!agent) {
    // Create supervisor agent
    agent = createAgent({
      agentName: `supervisor-${team.name}`,
      displayName: `${team.name} Supervisor`,
      config: { runtime: "claude-code" },
    });
    updateTeam(teamId, { supervisorId: agent.id });
  }

  send({ type: "status", message: `Starting team supervisor for ${team.name}...` });

  await launchAgent(agent.id, supervisorPrompt, (event) => {
    // Check for delegation events in assistant messages
    if (event.type === "assistant" && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === "text" && block.text.includes("[DELEGATE:")) {
          handleDelegation(teamId, block.text);
        }
      }
    }
    send(event);
  });

  updateTeam(teamId, { status: "idle" });
}

function buildSupervisorPrompt(team: Team, memberDescriptions: string, task: string): string {
  return `You are the supervisor of team "${team.name}".

Your team members:
${memberDescriptions}

Your task: ${task}

You can coordinate by:
1. Analyzing the task and breaking it into subtasks
2. Delegating with [DELEGATE: agentId | task description]
3. Checking results and synthesizing a final answer

Focus on the task and coordinate efficiently.`;
}

function handleDelegation(teamId: string, text: string): void {
  const match = text.match(/\[DELEGATE:\s*([^|]+)\s*\|\s*(.+)\]/);
  if (!match) return;

  const [, agentRef, task] = match;
  const agentId = agentRef.trim();

  insertLog({
    level: "info",
    source: "supervisor",
    sourceId: teamId,
    message: `Delegating to ${agentId}: ${task.trim().slice(0, 100)}`,
  });

  publishEvent({
    type: "task.delegated",
    source: `team:${teamId}`,
    payload: { agentId, task: task.trim() },
  });
}

/**
 * Send a message to a specific team member.
 */
export async function messageTeamMember(
  teamId: string,
  agentId: string,
  message: string,
  send: (event: ClaudeEvent) => void,
): Promise<void> {
  const team = getTeam(teamId);
  if (!team) {
    send({ type: "error", message: "Team not found" });
    send({ type: "done" });
    return;
  }

  const member = team.members.find((m) => m.agentId === agentId);
  if (!member) {
    send({ type: "error", message: "Agent is not a team member" });
    send({ type: "done" });
    return;
  }

  const agent = getAgent(agentId);
  if (!agent) {
    send({ type: "error", message: "Agent not found" });
    send({ type: "done" });
    return;
  }

  if (agent.sessionId) {
    await promptAgent(agentId, message, send);
  } else {
    await launchAgent(agentId, message, send);
  }
}

/**
 * Get team status overview.
 */
export function getTeamStatus(teamId: string): {
  team: Team;
  memberStatuses: { agentId: string; displayName: string; role: string; status: string }[];
  recentEvents: ReturnType<typeof checkEvents>;
  blackboard: ReturnType<typeof readAllBlackboard>;
} | null {
  const team = getTeam(teamId);
  if (!team) return null;

  const memberStatuses = team.members.map((m) => {
    const agent = getAgent(m.agentId);
    return {
      agentId: m.agentId,
      displayName: agent?.displayName || m.agentId,
      role: m.role,
      status: agent?.status || "unknown",
    };
  });

  const recentEvents = checkEvents({
    source: `team:${teamId}`,
    limit: 20,
    unconsumedOnly: false,
  });

  const blackboard = readAllBlackboard();

  return { team, memberStatuses, recentEvents, blackboard };
}
