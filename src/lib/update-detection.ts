import fs from "fs";
import path from "path";
import os from "os";
import type { UpdateInfo } from "./types";

const installedPluginsPath = path.join(
  os.homedir(),
  ".claude",
  "plugins",
  "installed_plugins.json"
);

let installedCache: Record<string, { version?: string }> | null = null;

function loadInstalled(): Record<string, { version?: string }> {
  if (installedCache) return installedCache;
  try {
    const data = JSON.parse(fs.readFileSync(installedPluginsPath, "utf-8"));
    installedCache = data.plugins || {};
  } catch {
    installedCache = {};
  }
  return installedCache!;
}

export function resetUpdateCache() {
  installedCache = null;
}

export function getUpdateInfo(
  cliName: string | null,
  availableVersion?: string
): UpdateInfo {
  if (!cliName) return { hasUpdate: false };

  const installed = loadInstalled();
  const entry = installed[cliName];
  if (!entry) return { hasUpdate: false };

  const installedVersion = entry.version;

  if (!installedVersion || !availableVersion) {
    return { installedVersion, availableVersion, hasUpdate: false };
  }

  const hasUpdate =
    installedVersion !== availableVersion &&
    compareVersions(availableVersion, installedVersion) > 0;

  return { installedVersion, availableVersion, hasUpdate };
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
