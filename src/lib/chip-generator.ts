import type { PluginSummary } from "./types";

type Platform = "claude-code" | "opencode";

export interface ConversationStarter {
  label: string;
  prompt: string;
  platform?: Platform;
}

interface PluginStarterRule {
  match: (plugin: PluginSummary) => boolean;
  generate: (plugin: PluginSummary) => ConversationStarter;
}

const PLUGIN_STARTERS: PluginStarterRule[] = [
  {
    match: (p) => p.name === "agent-sdk-dev",
    generate: () => ({
      label: "Build a custom agent",
      prompt: "Build me a custom agent with the Anthropic SDK",
      platform: "claude-code",
    }),
  },
  {
    match: (p) => p.name === "plugin-dev",
    generate: () => ({
      label: "Create a plugin",
      prompt: "Create a new Claude Code plugin for...",
      platform: "claude-code",
    }),
  },
  {
    match: (p) => p.name === "pr-review-toolkit",
    generate: () => ({
      label: "Review a PR",
      prompt: "Review my latest pull request",
      platform: "claude-code",
    }),
  },
  {
    match: (p) => p.name === "code-simplifier",
    generate: () => ({
      label: "Simplify my code",
      prompt: "Simplify and clean up my codebase",
      platform: "claude-code",
    }),
  },
  {
    match: (p) => p.name === "frontend-design",
    generate: () => ({
      label: "Design a component",
      prompt: "Design a new UI component",
      platform: "claude-code",
    }),
  },
  {
    match: (p) => p.name === "hookify",
    generate: () => ({
      label: "Create a hook",
      prompt: "Create a hook to prevent...",
      platform: "claude-code",
    }),
  },
  {
    match: (p) => p.name === "glintlock-seo",
    generate: () => ({
      label: "Run an SEO audit",
      prompt: "Run an SEO audit on my site",
      platform: "claude-code",
    }),
  },
  // Generic: plugins with agents
  {
    match: (p) => p.hasAgents && p.agentCount > 0,
    generate: (p) => {
      const displayName =
        p.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        label: `Run ${displayName}`,
        prompt: `Run ${displayName} agent on my project`,
        platform: p.platform || "claude-code",
      };
    },
  },
  // Generic: plugins with MCP servers
  {
    match: (p) => p.hasMcp,
    generate: (p) => {
      const displayName =
        p.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        label: `Connect to ${displayName}`,
        prompt: `Connect to ${p.name} and...`,
        platform: p.platform || "claude-code",
      };
    },
  },
];

const DEFAULT_STARTERS: ConversationStarter[] = [
  {
    label: "Set up my workflow",
    prompt: "Help me set up my development workflow",
  },
  {
    label: "Explore plugins",
    prompt: "What plugins are available for my project?",
  },
  {
    label: "Build an agent",
    prompt: "Help me build a custom agent for my codebase",
  },
  {
    label: "Automate a task",
    prompt: "Help me automate a repetitive development task",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateConversationStarters(
  plugins: PluginSummary[]
): ConversationStarter[] {
  const installed = plugins.filter((p) => p.installInfo?.isInstalled);

  if (installed.length === 0) {
    return shuffle(DEFAULT_STARTERS).slice(0, 4);
  }

  const starters: ConversationStarter[] = [];
  const seen = new Set<string>();

  for (const plugin of installed) {
    for (const rule of PLUGIN_STARTERS) {
      if (rule.match(plugin)) {
        const starter = rule.generate(plugin);
        if (!seen.has(starter.prompt)) {
          seen.add(starter.prompt);
          starters.push(starter);
        }
      }
    }
  }

  if (starters.length === 0) {
    return shuffle(DEFAULT_STARTERS).slice(0, 4);
  }

  // Pad with defaults if fewer than 4 plugin-derived starters
  if (starters.length < 4) {
    const remaining = DEFAULT_STARTERS.filter((d) => !seen.has(d.prompt));
    starters.push(...shuffle(remaining).slice(0, 4 - starters.length));
  }

  return shuffle(starters).slice(0, 4);
}
