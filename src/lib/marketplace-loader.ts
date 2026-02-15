import fs from "fs";
import path from "path";
import { marketplaces, type MarketplaceSource } from "../../marketplace.config";
import type { PluginSummary } from "./types";
import { getInstallState } from "./install-state";
import { detectAntiFeatures } from "./anti-features";
import { getUpdateInfo, resetUpdateCache } from "./update-detection";
import { loadAllUserData } from "./user-data";
import { loadOpenCodePlugins } from "./opencode-loader";

interface MarketplaceJson {
  name: string;
  plugins: Array<{
    name: string;
    description?: string;
    version?: string;
    category?: string;
    author?: string | { name: string; email?: string; url?: string };
    source: string | { source: string; url: string };
    homepage?: string;
    keywords?: string[];
    tags?: string[];
  }>;
}

interface PluginJson {
  name: string;
  version?: string;
  description?: string;
  author?: string | { name: string; email?: string; url?: string };
  homepage?: string;
  keywords?: string[];
}

function resolvePluginPath(
  marketplacePath: string,
  source: string | { source: string; url: string }
): string | null {
  if (typeof source === "string") {
    const resolved = path.resolve(marketplacePath, source);
    if (fs.existsSync(resolved)) return resolved;
    return null;
  }
  return null;
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

function loadPluginFromDir(
  pluginPath: string,
  marketplaceId: string,
  marketplacePath: string,
  fallback: MarketplaceJson["plugins"][number]
): PluginSummary {
  let pluginJson: PluginJson | null = null;
  const pjPath = path.join(pluginPath, ".claude-plugin", "plugin.json");
  if (fs.existsSync(pjPath)) {
    try {
      pluginJson = JSON.parse(fs.readFileSync(pjPath, "utf-8"));
    } catch {}
  }

  const commands = countFiles(path.join(pluginPath, "commands"), ".md");
  const skills = countDirs(path.join(pluginPath, "skills"));
  const agents = countFiles(path.join(pluginPath, "agents"), ".md");
  const hasMcp = fs.existsSync(path.join(pluginPath, ".mcp.json"));
  const hasHooks =
    fs.existsSync(path.join(pluginPath, "hooks", "hooks.json")) ||
    fs.existsSync(path.join(pluginPath, "hooks"));
  const symlink = isSymlink(pluginPath);

  const name = pluginJson?.name || fallback.name;
  const description =
    pluginJson?.description || fallback.description || "";
  const version = pluginJson?.version || fallback.version;
  const author = pluginJson?.author || fallback.author;
  const category = fallback.category;
  const homepage = pluginJson?.homepage || fallback.homepage;
  const keywords = pluginJson?.keywords || fallback.keywords || fallback.tags;

  const installInfo = getInstallState(name, marketplacePath);
  const antiFeatures = detectAntiFeatures(pluginPath);
  const updateInfo = getUpdateInfo(installInfo.cliName, version);

  return {
    name,
    description,
    version,
    category,
    author,
    platform: "claude-code" as const,
    marketplace: marketplaceId,
    slug: `${marketplaceId}--${name}`,
    hasCommands: commands.length > 0,
    hasSkills: skills.length > 0,
    hasMcp,
    hasHooks,
    hasAgents: agents.length > 0,
    commandCount: commands.length,
    skillCount: skills.length,
    agentCount: agents.length,
    pluginPath,
    isSymlink: symlink.isLink,
    symlinkTarget: symlink.target,
    homepage,
    keywords,
    installInfo,
    antiFeatures,
    updateInfo,
  };
}

function loadMarketplace(source: MarketplaceSource): PluginSummary[] {
  const manifestPath = path.join(
    source.path,
    ".claude-plugin",
    "marketplace.json"
  );
  if (!fs.existsSync(manifestPath)) return [];

  let manifest: MarketplaceJson;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    return [];
  }

  const plugins: PluginSummary[] = [];

  for (const entry of manifest.plugins) {
    const pluginPath = resolvePluginPath(source.path, entry.source);
    if (!pluginPath) continue;

    plugins.push(loadPluginFromDir(pluginPath, source.id, source.path, entry));
  }

  return plugins;
}

export function loadAllPlugins(): {
  plugins: PluginSummary[];
  sources: Array<MarketplaceSource & { count: number }>;
} {
  resetUpdateCache();
  const userData = loadAllUserData();
  const allPlugins: PluginSummary[] = [];
  const sources: Array<MarketplaceSource & { count: number }> = [];

  for (const source of marketplaces) {
    const plugins = loadMarketplace(source);
    allPlugins.push(...plugins);
    sources.push({ ...source, count: plugins.length });
  }

  // Load OpenCode plugins
  const ocPlugins = loadOpenCodePlugins();
  allPlugins.push(...ocPlugins);
  sources.push({ id: "opencode", name: "OpenCode", path: "", count: ocPlugins.length });

  // Attach user data to each plugin
  for (const plugin of allPlugins) {
    const ud = userData[plugin.slug];
    if (ud) {
      plugin.userData = ud;
    }
  }

  return { plugins: allPlugins, sources };
}
