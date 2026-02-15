import fs from "fs";
import path from "path";
import type { AntiFeatures } from "./types";

const API_KEY_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /password/i,
  /auth/i,
  /credential/i,
];

const NON_FREE_SERVICES = [
  "openai",
  "anthropic",
  "google",
  "aws",
  "azure",
  "stripe",
  "twilio",
  "sendgrid",
  "datadog",
  "sentry",
];

export function detectAntiFeatures(pluginPath: string): AntiFeatures {
  let usesNetwork = false;
  let executesShell = false;
  let requiresApiKeys = false;
  let hasNonFreeDeps = false;

  // Scan .mcp.json for network access and env var references
  const mcpPath = path.join(pluginPath, ".mcp.json");
  if (fs.existsSync(mcpPath)) {
    try {
      const raw = fs.readFileSync(mcpPath, "utf-8");
      const mcpConfig = JSON.parse(raw);

      const servers = mcpConfig.mcpServers || {};
      for (const server of Object.values(servers) as Record<string, unknown>[]) {
        // SSE or HTTP type means network access
        const type = server.type as string | undefined;
        if (type === "sse" || type === "http") {
          usesNetwork = true;
        }

        // URL in config means network access
        const url = server.url as string | undefined;
        if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
          usesNetwork = true;
        }

        // Check env vars for API keys
        const env = (server.env || {}) as Record<string, string>;
        for (const key of Object.keys(env)) {
          if (API_KEY_PATTERNS.some((p) => p.test(key))) {
            requiresApiKeys = true;
          }
        }

        // Check for non-free service references
        const rawLower = raw.toLowerCase();
        if (NON_FREE_SERVICES.some((svc) => rawLower.includes(svc))) {
          hasNonFreeDeps = true;
        }
      }
    } catch {}
  }

  // Scan hooks for shell command execution
  const hooksPath = path.join(pluginPath, "hooks", "hooks.json");
  if (fs.existsSync(hooksPath)) {
    try {
      const raw = fs.readFileSync(hooksPath, "utf-8");
      const hooks = JSON.parse(raw);

      // Any hook with a "command" field means shell execution
      for (const eventHooks of Object.values(hooks) as unknown[]) {
        if (Array.isArray(eventHooks)) {
          for (const hook of eventHooks) {
            if (
              hook &&
              typeof hook === "object" &&
              "command" in (hook as Record<string, unknown>)
            ) {
              executesShell = true;
              break;
            }
          }
        }
        if (executesShell) break;
      }
    } catch {}
  }

  return { usesNetwork, executesShell, requiresApiKeys, hasNonFreeDeps };
}
