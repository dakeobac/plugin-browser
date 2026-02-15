import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import type { OpencodeClient, Part, TextPart, ToolPart, EventMessagePartUpdated, EventMessagePartDelta, EventSessionIdle, EventSessionStatus } from "@opencode-ai/sdk/v2/client";
import type { ClaudeEvent, ContentBlock } from "./types";

const DEFAULT_PORT = 4096;

let client: OpencodeClient | null = null;
let currentPort: number | null = null;
let currentDirectory: string | null = null;

/**
 * Initialize or return the OpenCode SDK client.
 * Assumes `opencode serve` is running on the given port.
 */
export function getClient(directory?: string, port = DEFAULT_PORT): OpencodeClient {
  if (client && currentPort === port && currentDirectory === (directory || null)) return client;
  client = createOpencodeClient({
    baseUrl: `http://127.0.0.1:${port}`,
    directory,
    throwOnError: false,
  });
  currentPort = port;
  currentDirectory = directory || null;
  return client;
}

/**
 * Create a new OpenCode session.
 */
export async function createOpenCodeSession(
  directory: string,
  title?: string,
): Promise<{ sessionID: string }> {
  const c = getClient(directory);

  // Verify server is reachable before attempting session creation
  const { error: healthErr } = await c.global.health();
  if (healthErr) {
    throw new Error(
      "OpenCode server is not running. Start it with: opencode serve"
    );
  }

  const { data, error } = await c.session.create({
    directory,
    title: title || `Session ${new Date().toLocaleTimeString()}`,
  });
  if (error) throw new Error(`Failed to create OpenCode session: ${JSON.stringify(error)}`);
  return { sessionID: (data as { id: string }).id };
}

// --- Normalization: OpenCode Part events → ClaudeEvent ---

function normalizeTextPart(part: TextPart, sessionID: string): ClaudeEvent {
  return {
    type: "assistant",
    session_id: sessionID,
    message: {
      role: "assistant",
      content: [{ type: "text", text: part.text }],
    },
  };
}

function normalizeToolPart(part: ToolPart, sessionID: string): ClaudeEvent | null {
  const state = part.state;

  if (state.status === "pending" || state.status === "running") {
    return {
      type: "assistant",
      session_id: sessionID,
      message: {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: part.callID,
            name: part.tool,
            input: state.input as Record<string, unknown>,
          },
        ],
      },
    };
  }

  if (state.status === "completed") {
    return {
      type: "user",
      session_id: sessionID,
      message: {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: part.callID,
            content: state.output,
          },
        ],
      },
    };
  }

  if (state.status === "error") {
    return {
      type: "user",
      session_id: sessionID,
      message: {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: part.callID,
            content: `Error: ${state.error}`,
          },
        ],
      },
    };
  }

  return null;
}

/**
 * Normalize an OpenCode Part into a ClaudeEvent.
 * Returns null for parts we don't render (step-start, snapshot, etc.)
 */
export function normalizePart(part: Part, sessionID: string): ClaudeEvent | null {
  switch (part.type) {
    case "text":
      return normalizeTextPart(part, sessionID);
    case "tool":
      return normalizeToolPart(part, sessionID);
    default:
      // Skip reasoning, step-start, step-finish, snapshot, patch, agent, retry, compaction, subtask
      return null;
  }
}

/**
 * Stream OpenCode session prompt as normalized ClaudeEvent SSE.
 * Subscribes to global events, sends the prompt, and yields normalized events.
 */
export async function streamOpenCodePrompt(
  sessionID: string,
  directory: string,
  text: string,
  send: (event: ClaudeEvent) => void,
): Promise<void> {
  const c = getClient(directory);

  // Subscribe to global events to receive part updates
  const { stream } = await c.event.subscribe({ directory });

  // Track accumulated text content per assistant message
  const textAccumulator = new Map<string, string>();

  // Process events in background
  const eventProcessor = (async () => {
    try {
      for await (const event of stream) {
        const ev = event as { type: string; properties?: Record<string, unknown> };

        if (ev.type === "message.part.updated") {
          const props = (ev as unknown as EventMessagePartUpdated).properties;
          const part = props.part;
          if (part.sessionID !== sessionID) continue;

          const normalized = normalizePart(part, sessionID);
          if (normalized) send(normalized);
        } else if (ev.type === "message.part.delta") {
          const props = (ev as unknown as EventMessagePartDelta).properties;
          if (props.sessionID !== sessionID) continue;

          // Accumulate text deltas
          if (props.field === "text") {
            const key = `${props.messageID}:${props.partID}`;
            const prev = textAccumulator.get(key) || "";
            const full = prev + props.delta;
            textAccumulator.set(key, full);

            send({
              type: "assistant",
              session_id: sessionID,
              message: {
                role: "assistant",
                content: [{ type: "text", text: full }],
              },
            });
          }
        } else if (ev.type === "session.idle") {
          const props = (ev as unknown as EventSessionIdle).properties;
          if (props.sessionID === sessionID) {
            send({ type: "done" });
            break;
          }
        } else if (ev.type === "session.error") {
          const props = ev.properties as { sessionID?: string; error?: string } | undefined;
          if (props?.sessionID === sessionID) {
            send({ type: "error", message: props?.error || "OpenCode session error" });
            break;
          }
        }
      }
    } catch (err) {
      send({ type: "error", message: (err as Error).message });
    }
  })();

  // Send the prompt
  const { error } = await c.session.prompt({
    sessionID,
    directory,
    parts: [{ type: "text", text }],
    model: { providerID: "", modelID: "" },
  });

  if (error) {
    send({ type: "error", message: `Prompt failed: ${JSON.stringify(error)}` });
    send({ type: "done" });
    return;
  }

  // Wait for the event stream to complete (session.idle)
  await eventProcessor;
}
