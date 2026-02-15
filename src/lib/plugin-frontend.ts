import fs from "fs";
import path from "path";
import type { PluginSummary, PluginFrontend } from "./types";

const FRONTEND_GLOBS = [
  "dashboard.html",
  "index.html",
  "frontend/index.html",
  "ui/index.html",
];

export function detectPluginFrontends(
  plugins: PluginSummary[]
): PluginFrontend[] {
  const results: PluginFrontend[] = [];

  for (const plugin of plugins) {
    if (!plugin.installInfo?.isInstalled) continue;

    for (const candidate of FRONTEND_GLOBS) {
      const fullPath = path.join(plugin.pluginPath, candidate);
      if (fs.existsSync(fullPath)) {
        results.push({
          slug: plugin.slug,
          name: plugin.name,
          pluginPath: plugin.pluginPath,
          frontendFile: candidate,
          frontendUrl: `/api/plugin-frontend/${encodeURIComponent(plugin.slug)}`,
        });
        break; // Use first match
      }
    }
  }

  return results;
}
