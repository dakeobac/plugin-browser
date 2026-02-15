import fs from "fs";
import path from "path";
import { marketplaces } from "../../marketplace.config";
import type { ScaffoldRequest, ScaffoldResult } from "./types";

function getMarketplacePath(marketplaceId: string): string | null {
  const mkt = marketplaces.find((m) => m.id === marketplaceId);
  return mkt?.path || null;
}

function getPluginsDir(marketplacePath: string): string {
  return path.join(marketplacePath, "plugins");
}

export function scaffoldPlugin(request: ScaffoldRequest): ScaffoldResult {
  const marketplacePath = getMarketplacePath(request.targetMarketplace);
  if (!marketplacePath) {
    return {
      success: false,
      error: `Unknown marketplace: ${request.targetMarketplace}`,
    };
  }

  // Validate name format
  if (!/^[a-z][a-z0-9-]*$/.test(request.name)) {
    return {
      success: false,
      error:
        "Plugin name must start with a letter, contain only lowercase letters, numbers, and hyphens",
    };
  }

  const pluginsDir = getPluginsDir(marketplacePath);
  const pluginDir = path.join(pluginsDir, request.name);

  // Safety: fail if directory already exists
  if (fs.existsSync(pluginDir)) {
    return {
      success: false,
      error: `Directory already exists: ${pluginDir}`,
    };
  }

  // Ensure plugins/ directory exists
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  const filesCreated: string[] = [];

  try {
    // Create plugin directory
    fs.mkdirSync(pluginDir, { recursive: true });

    // .claude-plugin/plugin.json
    const claudePluginDir = path.join(pluginDir, ".claude-plugin");
    fs.mkdirSync(claudePluginDir, { recursive: true });
    const pluginJson = {
      name: request.name,
      version: "0.1.0",
      description: request.description,
      ...(request.author ? { author: request.author } : {}),
    };
    const pjPath = path.join(claudePluginDir, "plugin.json");
    fs.writeFileSync(pjPath, JSON.stringify(pluginJson, null, 2) + "\n");
    filesCreated.push(".claude-plugin/plugin.json");

    // README.md
    const readmeLines = [
      `# ${request.name}`,
      "",
      request.description,
      "",
      "## Components",
      "",
    ];
    if (request.commands.length > 0) {
      readmeLines.push(
        `- **Commands**: ${request.commands.map((c) => `\`/${c}\``).join(", ")}`
      );
    }
    if (request.skills.length > 0) {
      readmeLines.push(
        `- **Skills**: ${request.skills.map((s) => `\`${s}\``).join(", ")}`
      );
    }
    if (request.agents.length > 0) {
      readmeLines.push(
        `- **Agents**: ${request.agents.map((a) => `\`${a}\``).join(", ")}`
      );
    }
    if (request.includeMcp) readmeLines.push("- **MCP**: Server configured");
    if (request.includeHooks) readmeLines.push("- **Hooks**: Configured");
    readmeLines.push("");
    fs.writeFileSync(
      path.join(pluginDir, "README.md"),
      readmeLines.join("\n")
    );
    filesCreated.push("README.md");

    // Commands
    if (request.commands.length > 0) {
      const commandsDir = path.join(pluginDir, "commands");
      fs.mkdirSync(commandsDir, { recursive: true });
      for (const cmd of request.commands) {
        const cmdContent = [
          "---",
          `description: "${cmd} command"`,
          "allowed-tools:",
          '  - "Read"',
          '  - "Glob"',
          '  - "Grep"',
          "---",
          "",
          `# ${cmd}`,
          "",
          "TODO: Implement this command.",
          "",
        ].join("\n");
        fs.writeFileSync(path.join(commandsDir, `${cmd}.md`), cmdContent);
        filesCreated.push(`commands/${cmd}.md`);
      }
    }

    // Skills
    if (request.skills.length > 0) {
      const skillsDir = path.join(pluginDir, "skills");
      fs.mkdirSync(skillsDir, { recursive: true });
      for (const skill of request.skills) {
        const skillDir = path.join(skillsDir, skill);
        fs.mkdirSync(skillDir, { recursive: true });
        fs.mkdirSync(path.join(skillDir, "references"), { recursive: true });
        const skillContent = [
          `# ${skill}`,
          "",
          `This skill should be used when the user asks to "${skill}".`,
          "",
          "TODO: Add skill instructions.",
          "",
        ].join("\n");
        fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillContent);
        filesCreated.push(`skills/${skill}/SKILL.md`);
        filesCreated.push(`skills/${skill}/references/`);
      }
    }

    // Agents
    if (request.agents.length > 0) {
      const agentsDir = path.join(pluginDir, "agents");
      fs.mkdirSync(agentsDir, { recursive: true });
      for (const agent of request.agents) {
        const agentContent = [
          "---",
          `name: "${agent}"`,
          `description: |`,
          `  ${agent} agent.`,
          "",
          `  <example>`,
          `  User: Use the ${agent} agent`,
          `  </example>`,
          `model: sonnet`,
          `color: blue`,
          "---",
          "",
          `You are the ${agent} agent.`,
          "",
          "TODO: Implement agent system prompt.",
          "",
        ].join("\n");
        fs.writeFileSync(path.join(agentsDir, `${agent}.md`), agentContent);
        filesCreated.push(`agents/${agent}.md`);
      }
    }

    // MCP
    if (request.includeMcp) {
      const mcpJson = {
        mcpServers: {
          [`${request.name}-server`]: {
            command: "node",
            args: ["${CLAUDE_PLUGIN_ROOT}/server.js"],
          },
        },
      };
      fs.writeFileSync(
        path.join(pluginDir, ".mcp.json"),
        JSON.stringify(mcpJson, null, 2) + "\n"
      );
      filesCreated.push(".mcp.json");
    }

    // Hooks
    if (request.includeHooks) {
      const hooksDir = path.join(pluginDir, "hooks");
      fs.mkdirSync(hooksDir, { recursive: true });
      const hooksJson = {
        hooks: {
          PreToolUse: [],
          PostToolUse: [],
          Stop: [],
          SessionStart: [],
          SessionEnd: [],
        },
      };
      fs.writeFileSync(
        path.join(hooksDir, "hooks.json"),
        JSON.stringify(hooksJson, null, 2) + "\n"
      );
      filesCreated.push("hooks/hooks.json");
    }

    // Register in manifest
    let registeredInManifest = false;
    if (request.registerInManifest) {
      const manifestPath = path.join(
        marketplacePath,
        ".claude-plugin",
        "marketplace.json"
      );
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(
            fs.readFileSync(manifestPath, "utf-8")
          );
          // Check for duplicate name
          const exists = manifest.plugins?.some(
            (p: { name: string }) => p.name === request.name
          );
          if (!exists) {
            const entry: Record<string, string> = {
              name: request.name,
              description: request.description,
              source: `plugins/${request.name}`,
            };
            if (request.category) entry.category = request.category;
            manifest.plugins = manifest.plugins || [];
            manifest.plugins.push(entry);
            fs.writeFileSync(
              manifestPath,
              JSON.stringify(manifest, null, 2) + "\n"
            );
            registeredInManifest = true;
          }
        } catch {
          // Non-fatal: manifest update failed
        }
      }
    }

    return {
      success: true,
      pluginPath: pluginDir,
      filesCreated,
      registeredInManifest,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
