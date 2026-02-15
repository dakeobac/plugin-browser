import fs from "fs";
import path from "path";
import { opencodePaths } from "../../marketplace.config";
import type { PluginSummary } from "./types";
import { loadAllUserData } from "./user-data";

interface OpenCodeJson {
  model?: string;
  default_agent?: string;
  instructions?: string[];
  mcp?: Record<string, unknown>;
  agent?: Record<string, { description?: string; mode?: string }>;
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".claude",
  "plugin-browser",
]);

function countFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(ext) && !f.startsWith("."));
  } catch {
    return [];
  }
}

function countDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir).filter((f) => {
      try {
        return fs.statSync(path.join(dir, f)).isDirectory() && !f.startsWith(".");
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function isSymlink(filePath: string): { isLink: boolean; target?: string } {
  try {
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink()) {
      return { isLink: true, target: fs.readlinkSync(filePath) };
    }
  } catch {}
  return { isLink: false };
}

function loadOpenCodePlugin(pluginDir: string): PluginSummary | null {
  const configPath = path.join(pluginDir, "opencode.json");
  if (!fs.existsSync(configPath)) return null;

  let config: OpenCodeJson;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }

  const ocDir = path.join(pluginDir, ".opencode");
  const commands = countFiles(path.join(ocDir, "commands"), ".md");
  const skills = countDirs(path.join(ocDir, "skills"));
  const agents = countFiles(path.join(ocDir, "agents"), ".md");
  const hasMcp = config.mcp != null && Object.keys(config.mcp).length > 0;
  const hasHooks = fs.existsSync(path.join(ocDir, "hooks"));
  const symlink = isSymlink(pluginDir);
  const name = path.basename(pluginDir);

  // Try to read description from README
  let description = "";
  const readmePath = path.join(pluginDir, "README.md");
  if (fs.existsSync(readmePath)) {
    try {
      const readme = fs.readFileSync(readmePath, "utf-8");
      // Use the first non-heading, non-empty line as description
      const lines = readme.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("!") && !trimmed.startsWith("---")) {
          description = trimmed;
          break;
        }
      }
    } catch {}
  }

  // Fall back to default_agent description
  if (!description && config.agent && config.default_agent) {
    const defaultAgent = config.agent[config.default_agent];
    if (defaultAgent?.description) {
      description = defaultAgent.description;
    }
  }

  return {
    name,
    description,
    platform: "opencode",
    marketplace: "opencode",
    slug: `opencode--${name}`,
    hasCommands: commands.length > 0,
    hasSkills: skills.length > 0,
    hasMcp,
    hasHooks,
    hasAgents: agents.length > 0,
    commandCount: commands.length,
    skillCount: skills.length,
    agentCount: agents.length,
    pluginPath: pluginDir,
    isSymlink: symlink.isLink,
    symlinkTarget: symlink.target,
  };
}

export function loadOpenCodePlugins(): PluginSummary[] {
  const plugins: PluginSummary[] = [];
  const seen = new Set<string>();

  for (const scanRoot of opencodePaths) {
    if (!fs.existsSync(scanRoot)) continue;

    let entries: string[];
    try {
      entries = fs.readdirSync(scanRoot);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.startsWith(".") || SKIP_DIRS.has(entry)) continue;
      const childPath = path.join(scanRoot, entry);

      try {
        if (!fs.statSync(childPath).isDirectory()) continue;
      } catch {
        continue;
      }

      if (!fs.existsSync(path.join(childPath, "opencode.json"))) continue;

      const realPath = fs.realpathSync(childPath);
      if (seen.has(realPath)) continue;
      seen.add(realPath);

      const plugin = loadOpenCodePlugin(childPath);
      if (plugin) plugins.push(plugin);
    }
  }

  return plugins;
}
