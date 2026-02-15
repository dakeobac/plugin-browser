import fs from "fs";
import path from "path";
import os from "os";
import { marketplaces } from "../../marketplace.config";
import type { McpServerConfig, CreateMcpServerRequest } from "./types";

const MANUAL_CONFIG_FILE = path.join(os.homedir(), ".claude", "engram-mcp.json");
const CLAUDE_SETTINGS_FILE = path.join(os.homedir(), ".claude", "settings.json");

function generateId(source: string, name: string): string {
  return `${source}-${name}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

/**
 * Discover MCP servers from plugin .mcp.json files across all marketplace paths.
 */
function discoverPluginMcpServers(): McpServerConfig[] {
  const servers: McpServerConfig[] = [];

  for (const marketplace of marketplaces) {
    if (!fs.existsSync(marketplace.path)) continue;

    let entries: string[];
    try {
      entries = fs.readdirSync(marketplace.path);
    } catch {
      continue;
    }

    for (const entry of entries) {
      const mcpJsonPath = path.join(marketplace.path, entry, ".mcp.json");
      if (!fs.existsSync(mcpJsonPath)) continue;

      try {
        const raw = fs.readFileSync(mcpJsonPath, "utf-8");
        const mcpConfig = JSON.parse(raw);

        // Handle both flat and nested mcpServers format
        const mcpServers = mcpConfig.mcpServers || mcpConfig;

        for (const [name, config] of Object.entries(mcpServers)) {
          const cfg = config as Record<string, unknown>;
          servers.push({
            id: generateId("plugin", `${entry}-${name}`),
            name,
            displayName: `${name} (${entry})`,
            command: (cfg.command as string) || "",
            args: (cfg.args as string[]) || [],
            env: cfg.env as Record<string, string> | undefined,
            cwd: cfg.cwd as string | undefined,
            status: "unknown",
            source: "plugin",
          });
        }
      } catch {
        // Malformed .mcp.json — skip
      }
    }
  }

  return servers;
}

/**
 * Discover MCP servers from ~/.claude/settings.json.
 */
function discoverSettingsMcpServers(): McpServerConfig[] {
  const servers: McpServerConfig[] = [];

  try {
    if (!fs.existsSync(CLAUDE_SETTINGS_FILE)) return servers;
    const raw = fs.readFileSync(CLAUDE_SETTINGS_FILE, "utf-8");
    const settings = JSON.parse(raw);
    const mcpServers = settings.mcpServers;
    if (!mcpServers || typeof mcpServers !== "object") return servers;

    for (const [name, config] of Object.entries(mcpServers)) {
      const cfg = config as Record<string, unknown>;
      servers.push({
        id: generateId("settings", name),
        name,
        displayName: name,
        command: (cfg.command as string) || "",
        args: (cfg.args as string[]) || [],
        env: cfg.env as Record<string, string> | undefined,
        cwd: cfg.cwd as string | undefined,
        status: "unknown",
        source: "settings",
      });
    }
  } catch {
    // settings.json missing or malformed
  }

  return servers;
}

/**
 * Load manually configured MCP servers from ~/.claude/engram-mcp.json.
 */
function loadManualServers(): McpServerConfig[] {
  try {
    if (!fs.existsSync(MANUAL_CONFIG_FILE)) return [];
    const raw = fs.readFileSync(MANUAL_CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as McpServerConfig[];
  } catch {
    return [];
  }
}

function saveManualServers(servers: McpServerConfig[]): void {
  fs.mkdirSync(path.dirname(MANUAL_CONFIG_FILE), { recursive: true });
  fs.writeFileSync(MANUAL_CONFIG_FILE, JSON.stringify(servers, null, 2));
}

/**
 * Get all MCP servers from all sources (plugin, settings, manual).
 */
export function getAllMcpServers(): McpServerConfig[] {
  const plugin = discoverPluginMcpServers();
  const settings = discoverSettingsMcpServers();
  const manual = loadManualServers();
  return [...plugin, ...settings, ...manual];
}

/**
 * Get a single MCP server by ID.
 */
export function getMcpServer(id: string): McpServerConfig | undefined {
  return getAllMcpServers().find((s) => s.id === id);
}

/**
 * Add a manually configured MCP server.
 */
export function addManualServer(req: CreateMcpServerRequest): McpServerConfig {
  const servers = loadManualServers();
  const server: McpServerConfig = {
    id: generateId("manual", req.name),
    name: req.name,
    displayName: req.displayName,
    command: req.command,
    args: req.args,
    env: req.env,
    cwd: req.cwd,
    status: "unknown",
    source: "manual",
  };
  servers.push(server);
  saveManualServers(servers);
  return server;
}

/**
 * Remove a manually configured MCP server.
 * Returns false if server not found or not manual.
 */
export function removeManualServer(id: string): boolean {
  const servers = loadManualServers();
  const idx = servers.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  servers.splice(idx, 1);
  saveManualServers(servers);
  return true;
}

/**
 * Update a manually configured MCP server.
 */
export function updateManualServer(id: string, updates: Partial<CreateMcpServerRequest>): McpServerConfig | undefined {
  const servers = loadManualServers();
  const server = servers.find((s) => s.id === id);
  if (!server) return undefined;
  if (updates.name !== undefined) server.name = updates.name;
  if (updates.displayName !== undefined) server.displayName = updates.displayName;
  if (updates.command !== undefined) server.command = updates.command;
  if (updates.args !== undefined) server.args = updates.args;
  if (updates.env !== undefined) server.env = updates.env;
  if (updates.cwd !== undefined) server.cwd = updates.cwd;
  saveManualServers(servers);
  return server;
}

/**
 * Compose MCP config for agent launch.
 * Returns a Record of server name → { command, args, env } for embedding in .mcp.json.
 */
export function composeMcpConfig(serverIds: string[]): Record<string, { command: string; args: string[]; env?: Record<string, string> }> {
  const allServers = getAllMcpServers();
  const config: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {};

  for (const id of serverIds) {
    const server = allServers.find((s) => s.id === id);
    if (server) {
      config[server.name] = {
        command: server.command,
        args: server.args,
        ...(server.env && Object.keys(server.env).length > 0 ? { env: server.env } : {}),
      };
    }
  }

  return config;
}
