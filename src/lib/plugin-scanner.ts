import fs from "fs";
import path from "path";
import { marketplaces, scanPaths } from "../../marketplace.config";
import type { DiscoveredPlugin, ScanResult } from "./types";

interface PluginJson {
  name: string;
  version?: string;
  description?: string;
}

function readPluginJson(pluginDir: string): PluginJson | null {
  const pjPath = path.join(pluginDir, ".claude-plugin", "plugin.json");
  if (!fs.existsSync(pjPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pjPath, "utf-8"));
  } catch {
    return null;
  }
}

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
        return (
          fs.statSync(path.join(dir, f)).isDirectory() && !f.startsWith(".")
        );
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function isPluginDir(dir: string): boolean {
  return fs.existsSync(path.join(dir, ".claude-plugin"));
}

function isOpenCodeDir(dir: string): boolean {
  return fs.existsSync(path.join(dir, "opencode.json"));
}

function getRealPath(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}

/** Build a map of realPath → marketplace IDs for all registered plugins */
function buildRegistrationMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const mkt of marketplaces) {
    const manifestPath = path.join(
      mkt.path,
      ".claude-plugin",
      "marketplace.json"
    );
    if (!fs.existsSync(manifestPath)) continue;

    let manifest: { plugins: Array<{ source: string | { source: string } }> };
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    } catch {
      continue;
    }

    for (const entry of manifest.plugins) {
      const source =
        typeof entry.source === "string" ? entry.source : entry.source?.source;
      if (!source) continue;
      const resolved = path.resolve(mkt.path, source);
      if (!fs.existsSync(resolved)) continue;
      const real = getRealPath(resolved);
      const existing = map.get(real) || [];
      if (!existing.includes(mkt.id)) {
        existing.push(mkt.id);
      }
      map.set(real, existing);
    }
  }

  return map;
}

function discoverPlugin(
  pluginDir: string,
  registrationMap: Map<string, string[]>
): DiscoveredPlugin {
  const pluginJson = readPluginJson(pluginDir);
  const realPath = getRealPath(pluginDir);

  const commands = countFiles(path.join(pluginDir, "commands"), ".md");
  const skills = countDirs(path.join(pluginDir, "skills"));
  const agents = countFiles(path.join(pluginDir, "agents"), ".md");
  const hasMcp = fs.existsSync(path.join(pluginDir, ".mcp.json"));
  const hasHooks =
    fs.existsSync(path.join(pluginDir, "hooks", "hooks.json")) ||
    fs.existsSync(path.join(pluginDir, "hooks"));

  return {
    name: pluginJson?.name || path.basename(pluginDir),
    description: pluginJson?.description || "",
    version: pluginJson?.version,
    platform: "claude-code",
    path: pluginDir,
    realPath,
    hasPluginJson: pluginJson !== null,
    hasCommands: commands.length > 0,
    hasSkills: skills.length > 0,
    hasMcp,
    hasHooks,
    hasAgents: agents.length > 0,
    commandCount: commands.length,
    skillCount: skills.length,
    agentCount: agents.length,
    registeredIn: registrationMap.get(realPath) || [],
  };
}

function discoverOpenCodePlugin(pluginDir: string): DiscoveredPlugin {
  const realPath = getRealPath(pluginDir);
  const ocDir = path.join(pluginDir, ".opencode");

  const commands = countFiles(path.join(ocDir, "commands"), ".md");
  const skills = countDirs(path.join(ocDir, "skills"));
  const agents = countFiles(path.join(ocDir, "agents"), ".md");

  let hasMcp = false;
  try {
    const config = JSON.parse(fs.readFileSync(path.join(pluginDir, "opencode.json"), "utf-8"));
    hasMcp = config.mcp != null && Object.keys(config.mcp).length > 0;
  } catch {}

  const hasHooks = fs.existsSync(path.join(ocDir, "hooks"));

  return {
    name: path.basename(pluginDir),
    description: "",
    platform: "opencode",
    path: pluginDir,
    realPath,
    hasPluginJson: true,
    hasCommands: commands.length > 0,
    hasSkills: skills.length > 0,
    hasMcp,
    hasHooks,
    hasAgents: agents.length > 0,
    commandCount: commands.length,
    skillCount: skills.length,
    agentCount: agents.length,
    registeredIn: [],
  };
}

// Directories to skip during scanning
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".claude",
  "plugin-browser", // skip ourselves
]);

export function scanForPlugins(): ScanResult {
  const registrationMap = buildRegistrationMap();
  const found: DiscoveredPlugin[] = [];
  const seen = new Set<string>();
  let totalScanned = 0;

  for (const scanRoot of scanPaths) {
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

      let stat: fs.Stats;
      try {
        stat = fs.statSync(childPath);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;

      totalScanned++;

      // Check if this directory itself is a Claude Code plugin
      if (isPluginDir(childPath)) {
        const real = getRealPath(childPath);
        if (!seen.has(real)) {
          seen.add(real);
          found.push(discoverPlugin(childPath, registrationMap));
        }
      }

      // Check if this directory is an OpenCode plugin
      if (isOpenCodeDir(childPath)) {
        const real = getRealPath(childPath);
        if (!seen.has(real)) {
          seen.add(real);
          found.push(discoverOpenCodePlugin(childPath));
        }
      }

      // Check plugins/ subdirectory (e.g. monorepos with plugins/*)
      const pluginsSubdir = path.join(childPath, "plugins");
      if (fs.existsSync(pluginsSubdir)) {
        let subEntries: string[];
        try {
          subEntries = fs.readdirSync(pluginsSubdir);
        } catch {
          continue;
        }
        for (const sub of subEntries) {
          if (sub.startsWith(".")) continue;
          const subPath = path.join(pluginsSubdir, sub);
          try {
            if (!fs.statSync(subPath).isDirectory()) continue;
          } catch {
            continue;
          }
          if (isPluginDir(subPath)) {
            const real = getRealPath(subPath);
            if (!seen.has(real)) {
              seen.add(real);
              found.push(discoverPlugin(subPath, registrationMap));
            }
          }
        }
      }
    }
  }

  // Sort: unregistered first, then alphabetically
  found.sort((a, b) => {
    const aReg = a.registeredIn.length > 0 ? 1 : 0;
    const bReg = b.registeredIn.length > 0 ? 1 : 0;
    if (aReg !== bReg) return aReg - bReg;
    return a.name.localeCompare(b.name);
  });

  return {
    plugins: found,
    totalScanned,
    scanPaths,
  };
}
