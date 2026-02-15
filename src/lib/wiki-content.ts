export interface WikiTopic {
  slug: string;
  title: string;
  category: string;
  content: string;
}

export const wikiTopics: WikiTopic[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    category: "Basics",
    content: `# Getting Started

Welcome to **Plugin Factory** — a local dashboard for browsing, analyzing, and creating Claude Code plugins.

## What is Plugin Factory?

Plugin Factory connects to your local marketplace directories and gives you a visual interface to:

- **Browse** all plugins across your registered marketplaces
- **Search and filter** by name, category, or features
- **Install, enable, and manage** plugins via the Claude CLI
- **Discover patterns** across your plugin ecosystem
- **Create new plugins** from suggestions or from scratch
- **Build plugins** with Claude Code directly in the browser
- **Chat with Claude Code** through the Agent Mode interface

## Quick Tour

### Browse (/)
The main page shows all plugins across all marketplaces. Use the search bar and marketplace tabs to filter. Click any plugin card for full details.

### Discover (/discover)
The discovery engine scans your configured directories for potential plugins, analyzes patterns across existing plugins, and suggests new plugin ideas.

### Agent (/agent)
A full chat interface to Claude Code. Send any prompt and watch Claude work in real-time with streaming output, tool use visualization, and session persistence.

### Wiki (/wiki)
You're here! Documentation for all Plugin Factory features.

### Home (/home)
Dashboard showing your installed plugins, their status, and quick actions.

## Configuration

Plugin Factory reads from marketplaces defined in \`marketplace.config.ts\` at the project root. Each marketplace points to a directory containing a \`.claude-plugin/marketplace.json\` manifest.

\`\`\`typescript
export const marketplaces = [
  { id: "personal", name: "Personal", path: "/path/to/claude-plugins" },
  { id: "official", name: "Anthropic Official", path: "~/.claude/plugins/marketplaces/claude-code-plugins" },
];
\`\`\`
`,
  },
  {
    slug: "browse",
    title: "Browse Plugins",
    category: "Features",
    content: `# Browse Plugins

The Browse page is the main landing page of Plugin Factory.

## Marketplace Tabs

Plugins are organized by marketplace source. Click tabs to filter by marketplace, or use "All" to see everything. Each tab shows its plugin count.

## Search

The search bar filters plugins by name and description in real-time. Combined with marketplace tabs, you can quickly narrow down what you're looking for.

## Plugin Cards

Each card shows:

- **Name** and **description**
- **Version** badge
- **Category** badge (color-coded)
- **Feature indicators** — icons for commands, skills, agents, MCP servers, and hooks with counts
- **Install status** — whether the plugin is installed and enabled
- **Update badge** — appears when a newer version is available
- **Anti-feature warnings** — network access, shell commands, API keys, non-free dependencies

## Plugin Detail Page

Click any card to view the full detail page:

- Complete README rendered as markdown
- Full list of commands, skills, and agents
- Install/update/enable/disable/uninstall buttons
- Anti-feature details with severity levels
- User rating and notes
- Link to open the plugin in Agent Mode

## Install & Manage

For plugins in registered CLI marketplaces, you can:

| Action | What it does |
|--------|-------------|
| Install | Runs \`claude plugin install <name>\` |
| Uninstall | Runs \`claude plugin uninstall <name>\` |
| Enable | Enables the plugin in settings |
| Disable | Disables the plugin in settings |
| Update | Re-installs to get the latest version |
`,
  },
  {
    slug: "discover",
    title: "Discover & Analyze",
    category: "Features",
    content: `# Discover & Analyze

The Discover page (\`/discover\`) is the Plugin Factory's intelligence engine. It has three tabs.

## Scanner Tab

The scanner walks your configured \`scanPaths\` directories looking for potential Claude Code plugins — directories with \`.claude-plugin/plugin.json\`, command files, skills, agents, MCP configs, or hooks.

For each discovered directory, it shows:
- Plugin name and path
- Feature breakdown (commands, skills, agents, MCP, hooks)
- Which marketplaces it's registered in (if any)

This helps you find plugins that exist on disk but aren't yet in any marketplace.

## Patterns Tab

The pattern analyzer examines your existing plugins and detects:

### Command Patterns
Common naming conventions across plugins. For example, if multiple plugins use \`audit\`, \`report\`, or \`setup\` commands, these get grouped as patterns.

### Structural Patterns
Common feature combinations. Examples:
- "Full-stack" plugins with commands + skills + agents + MCP + hooks
- "Command-only" plugins
- "MCP-powered" plugins

### Domain Groups
Plugins that share a domain prefix (e.g., "glintlock-seo" and "glintlock-site" share the "glintlock" domain).

## Suggestions Tab

Based on detected patterns, the engine suggests new plugins:

| Type | Description |
|------|-------------|
| Pattern Extraction | Shared commands that could become a standalone utility |
| Domain Expansion | New plugins for an existing domain |
| Pipeline Completion | Missing stages in a workflow (e.g., analyze → report → fix) |
| MCP Template | Services that could benefit from MCP integration |
| Cross-Domain | Plugins that bridge two different domains |

Click any suggestion to pre-fill the Create Plugin dialog.
`,
  },
  {
    slug: "create-plugins",
    title: "Create Plugins",
    category: "Features",
    content: `# Create Plugins

Plugin Factory supports the full plugin creation lifecycle — from scaffolding to implementation.

## Scaffolding

The Create Plugin dialog (accessible from the Suggestions tab) generates a complete plugin directory structure:

1. **Name** — lowercase, hyphenated (e.g., \`my-plugin\`)
2. **Description** — what the plugin does
3. **Category** — optional classification
4. **Target Marketplace** — where to create the plugin directory
5. **Commands** — comma-separated list of slash commands
6. **Skills** — comma-separated list of skills
7. **Agents** — comma-separated list of agents
8. **MCP Server** — include \`.mcp.json\` config
9. **Hooks** — include hooks directory
10. **Register in Manifest** — add to marketplace.json

The dialog shows a live directory tree preview as you configure options.

## Build with Claude Code

After scaffolding, click **"Build with Claude Code"** to launch an in-dialog chat session. Claude Code will:

1. Read the scaffolded structure
2. Run the \`/plugin-dev:create-plugin\` workflow
3. Implement commands, skills, agents, and other components
4. Validate the plugin against conventions

You can interact with Claude during the build process — ask questions, request changes, or provide additional context.

## Manual Creation

You can also create plugins manually:

\`\`\`bash
mkdir my-plugin
cd my-plugin
# Run the plugin-dev workflow
claude "/plugin-dev:create-plugin"
\`\`\`

Or use the Agent Mode to have a more free-form conversation about plugin creation.
`,
  },
  {
    slug: "agent-mode",
    title: "Agent Mode",
    category: "Features",
    content: `# Agent Mode

Agent Mode (\`/agent\`) is a full-screen chat interface to Claude Code, running directly in your browser.

## How It Works

Under the hood, Agent Mode uses the Claude CLI's streaming JSON output:

1. You send a message
2. The server spawns \`claude -p --output-format stream-json --verbose\`
3. Claude's NDJSON output is piped as Server-Sent Events to the browser
4. The UI renders text, tool use, and results in real-time
5. Follow-up messages use \`--resume <session-id>\` for continuity

## Features

### Streaming Output
Watch Claude think and work in real-time. Text appears as it's generated, and tool use blocks show what Claude is reading, writing, or executing.

### Tool Use Visualization
Each tool invocation appears as a collapsible card showing:
- Tool name (highlighted in amber)
- Input preview (file path, command, etc.)
- Full input/output details on expand

### Session Persistence
Sessions are tracked by Claude's built-in session ID. The sidebar shows your recent sessions, and you can resume any previous conversation.

### Plugin Context
From any plugin's detail page, click "Open in Agent" to start a session pre-loaded with that plugin's context (name and working directory).

## URL Parameters

| Parameter | Description |
|-----------|-------------|
| \`plugin\` | Plugin name for context |
| \`cwd\` | Working directory for Claude |

Example: \`/agent?plugin=my-plugin&cwd=/path/to/plugin\`

## Tips

- Use Agent Mode for complex, multi-step plugin development
- The streaming cursor shows when Claude is still generating
- Click "Stop" to interrupt Claude mid-response
- Each session maintains full conversation history via Claude's resume
`,
  },
  {
    slug: "plugin-dev-guide",
    title: "Plugin Development",
    category: "Development",
    content: `# Plugin Development Guide

A Claude Code plugin is a directory with a specific structure that Claude discovers and uses.

## Directory Structure

\`\`\`
my-plugin/
  .claude-plugin/
    plugin.json          # Plugin manifest
  README.md              # Documentation
  commands/              # Slash commands
    my-command.md
  skills/                # Skills (multi-file)
    my-skill/
      SKILL.md
      references/
  agents/                # Subagent definitions
    my-agent.md
  hooks/                 # Event hooks
    hooks.json
  .mcp.json              # MCP server config
\`\`\`

## plugin.json

The manifest file tells Claude about your plugin:

\`\`\`json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": "Your Name"
}
\`\`\`

## Commands

Commands are markdown files in \`commands/\` that define slash commands. Users invoke them with \`/plugin-name:command-name\`.

Each command file has YAML frontmatter for metadata:

\`\`\`markdown
---
description: What this command does
---

# Command instructions here
Claude will follow these instructions when the user runs this command.
\`\`\`

## Skills

Skills are directories under \`skills/\` with a \`SKILL.md\` file and optional \`references/\` for supporting files. They're auto-loaded based on context matching.

## Agents

Agents are markdown files in \`agents/\` that define specialized subagents with system prompts, tool access, and triggering conditions.

## Hooks

Hooks in \`hooks/hooks.json\` define shell commands that run on events like \`PreToolUse\`, \`PostToolUse\`, \`Stop\`, etc.

## MCP Servers

The \`.mcp.json\` file configures Model Context Protocol servers that provide external tools and data sources.

## Marketplace Registration

To make your plugin available in a marketplace, add an entry to the marketplace's \`.claude-plugin/marketplace.json\`:

\`\`\`json
{
  "name": "My Marketplace",
  "plugins": [
    {
      "name": "my-plugin",
      "description": "What it does",
      "source": "../path/to/my-plugin",
      "category": "Development"
    }
  ]
}
\`\`\`
`,
  },
];

export function getTopicBySlug(slug: string): WikiTopic | undefined {
  return wikiTopics.find((t) => t.slug === slug);
}

export function getAllTopicSlugs(): string[] {
  return wikiTopics.map((t) => t.slug);
}
