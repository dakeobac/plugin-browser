import fs from "fs";
import path from "path";
import os from "os";
import type { PluginUserData } from "./types";

const dataDir = path.join(os.homedir(), ".claude", "plugin-browser");
const dataPath = path.join(dataDir, "user-data.json");

export function loadAllUserData(): Record<string, PluginUserData> {
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    return {};
  }
}

export function getUserData(slug: string): PluginUserData | undefined {
  return loadAllUserData()[slug];
}

export function saveUserData(
  slug: string,
  data: { rating?: number; note?: string }
): PluginUserData {
  const all = loadAllUserData();
  const existing = all[slug] || {};
  const updated: PluginUserData = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  all[slug] = updated;

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(all, null, 2));
  return updated;
}
