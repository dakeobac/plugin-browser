#!/usr/bin/env node
/**
 * MCP Team Server — standalone Node.js process implementing MCP protocol.
 * Provides 12 tools for inter-agent coordination.
 *
 * Launched by team-server-manager.ts as a child process.
 * Communicates via stdin/stdout JSON-RPC.
 */

import { publishEvent, checkEvents, matchEvents, consumeEvent } from "./event-bus";
import { readBlackboard, writeBlackboard, readAllBlackboard } from "./blackboard";
import { getAgent, getAllAgents } from "./agent-registry";
import { getTeam, listTeams } from "./team-store";
import getDb from "./db";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

const TOOLS = [
  {
    name: "publish_event",
    description: "Publish an event to the team event bus",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", description: "Event type (e.g. 'task.completed')" },
        payload: { type: "object", description: "Event payload" },
      },
      required: ["type"],
    },
  },
  {
    name: "check_events",
    description: "Check for events matching a type pattern",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Event type pattern (e.g. 'task.*')" },
        limit: { type: "number", description: "Max events to return" },
      },
    },
  },
  {
    name: "send_message",
    description: "Send a direct message to another agent",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Target agent ID" },
        content: { type: "string", description: "Message content" },
      },
      required: ["to", "content"],
    },
  },
  {
    name: "check_inbox",
    description: "Check messages sent to this agent",
    inputSchema: {
      type: "object",
      properties: {
        unreadOnly: { type: "boolean", description: "Only unread messages" },
      },
    },
  },
  {
    name: "list_team",
    description: "List all team agents with their status",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_agent_profile",
    description: "Get an agent's capabilities and profile",
    inputSchema: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Agent ID to look up" },
      },
      required: ["agentId"],
    },
  },
  {
    name: "read_blackboard",
    description: "Read a value from the team's shared blackboard",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Blackboard key to read (omit for all)" },
        teamId: { type: "string", description: "Team ID to scope the blackboard (defaults to _global)" },
      },
    },
  },
  {
    name: "update_blackboard",
    description: "Write a value to the team's shared blackboard",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Blackboard key" },
        value: { description: "Value to store" },
        teamId: { type: "string", description: "Team ID to scope the blackboard (defaults to _global)" },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "claim_task",
    description: "Claim a task from the task queue",
    inputSchema: {
      type: "object",
      properties: {
        taskType: { type: "string", description: "Type of task to claim" },
      },
    },
  },
  {
    name: "complete_task",
    description: "Mark a claimed task as completed with output",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "Task event ID" },
        output: { type: "string", description: "Task result" },
      },
      required: ["taskId", "output"],
    },
  },
  {
    name: "request_help",
    description: "Signal that you need assistance from another agent",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "What you need help with" },
        context: { type: "string", description: "Additional context" },
      },
      required: ["topic"],
    },
  },
  {
    name: "delegate_task",
    description: "Assign a task to another agent (supervisor only)",
    inputSchema: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Target agent" },
        task: { type: "string", description: "Task description" },
        priority: { type: "string", enum: ["high", "medium", "low"] },
      },
      required: ["agentId", "task"],
    },
  },
];

function handleToolCall(agentId: string, toolName: string, args: Record<string, unknown>): unknown {
  switch (toolName) {
    case "publish_event":
      return publishEvent({
        type: args.type as string,
        source: agentId,
        payload: (args.payload as Record<string, unknown>) || {},
      });

    case "check_events": {
      const pattern = args.pattern as string | undefined;
      if (pattern && pattern.includes("*")) {
        return matchEvents(pattern, (args.limit as number) || 20);
      }
      return checkEvents({
        type: pattern,
        limit: (args.limit as number) || 20,
      });
    }

    case "send_message": {
      const db = getDb();
      const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      db.prepare("INSERT INTO messages (id, from_agent, to_agent, content, timestamp) VALUES (?, ?, ?, ?, ?)")
        .run(id, agentId, args.to as string, args.content as string, new Date().toISOString());
      return { sent: true, messageId: id };
    }

    case "check_inbox": {
      const db = getDb();
      const unreadOnly = args.unreadOnly !== false;
      const condition = unreadOnly ? "AND read = 0" : "";
      const rows = db.prepare(`SELECT * FROM messages WHERE to_agent = ? ${condition} ORDER BY timestamp DESC LIMIT 20`)
        .all(agentId);
      // Mark as read
      if (unreadOnly) {
        db.prepare("UPDATE messages SET read = 1 WHERE to_agent = ? AND read = 0").run(agentId);
      }
      return rows;
    }

    case "list_team": {
      const agents = getAllAgents();
      return agents.map((a) => ({
        id: a.id,
        name: a.displayName,
        status: a.status,
        runtime: a.runtime,
      }));
    }

    case "get_agent_profile": {
      const agent = getAgent(args.agentId as string);
      if (!agent) return { error: "Agent not found" };
      return {
        id: agent.id,
        name: agent.displayName,
        status: agent.status,
        runtime: agent.runtime,
        config: {
          maxTurns: agent.config.maxTurns,
          permissionMode: agent.config.permissionMode,
        },
      };
    }

    case "read_blackboard": {
      const key = args.key as string | undefined;
      const teamId = (args.teamId as string) || "_global";
      if (key) {
        return readBlackboard(key, teamId) || { key, value: null };
      }
      return readAllBlackboard(teamId);
    }

    case "update_blackboard":
      return writeBlackboard({
        key: args.key as string,
        value: args.value,
        updatedBy: agentId,
        teamId: (args.teamId as string) || "_global",
      });

    case "claim_task": {
      const taskType = args.taskType as string || "task.delegated";
      const events = checkEvents({ type: taskType, unconsumedOnly: true, limit: 1 });
      if (events.length === 0) return { claimed: false, message: "No tasks available" };
      consumeEvent(events[0].id);
      return { claimed: true, task: events[0] };
    }

    case "complete_task":
      return publishEvent({
        type: "task.completed",
        source: agentId,
        payload: { taskId: args.taskId, output: args.output },
      });

    case "request_help":
      return publishEvent({
        type: "help.requested",
        source: agentId,
        payload: { topic: args.topic, context: args.context || "" },
      });

    case "delegate_task":
      return publishEvent({
        type: "task.delegated",
        source: agentId,
        payload: {
          agentId: args.agentId,
          task: args.task,
          priority: args.priority || "medium",
        },
      });

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Get the tool definitions for use in MCP config.
 */
export function getTeamServerTools() {
  return TOOLS;
}

/**
 * Handle a JSON-RPC request from the MCP client.
 */
export function handleJsonRpc(agentId: string, request: JsonRpcRequest): JsonRpcResponse {
  const { id, method, params } = request;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "engram-team-server", version: "1.0.0" },
      },
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { tools: TOOLS },
    };
  }

  if (method === "tools/call") {
    const toolName = params?.name as string;
    const args = (params?.arguments as Record<string, unknown>) || {};
    try {
      const result = handleToolCall(agentId, toolName, args);
      return {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: (err as Error).message },
      };
    }
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}
