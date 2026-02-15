import { query, type Query } from "@anthropic-ai/claude-agent-sdk";

export interface AgentOptions {
  prompt: string;
  cwd?: string;
  systemPrompt?: string;
  maxTurns?: number;
  permissionMode?: string;
  resumeSessionId?: string;
}

export interface AgentHandle {
  messages: Query;
  interrupt: () => Promise<void>;
}

export function startAgent(options: AgentOptions): AgentHandle {
  const permMode = options.permissionMode || "bypassPermissions";

  const queryOptions: Record<string, unknown> = {
    cwd: options.cwd || process.cwd(),
    permissionMode: permMode,
    includePartialMessages: true,
  };

  // bypassPermissions requires this flag
  if (permMode === "bypassPermissions") {
    queryOptions.allowDangerouslySkipPermissions = true;
  }

  if (options.systemPrompt) {
    queryOptions.systemPrompt = options.systemPrompt;
  }
  if (options.maxTurns) {
    queryOptions.maxTurns = options.maxTurns;
  }
  if (options.resumeSessionId) {
    queryOptions.resume = options.resumeSessionId;
  }

  const q = query({ prompt: options.prompt, options: queryOptions });

  return {
    messages: q,
    interrupt: () => q.interrupt(),
  };
}
