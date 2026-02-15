import fs from "fs";
import path from "path";
import type { PluginDetail } from "./types";
import type { PluginSummary } from "./types";

function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(ext) && !f.startsWith("."))
      .sort();
  } catch {
    return [];
  }
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => {
        try {
          return fs.statSync(path.join(dir, f)).isDirectory() && !f.startsWith(".");
        } catch {
          return false;
        }
      })
      .sort();
  } catch {
    return [];
  }
}

export function loadPluginDetail(summary: PluginSummary): PluginDetail {
  const pluginPath = summary.pluginPath;

  let readme: string | undefined;
  const readmePath = path.join(pluginPath, "README.md");
  if (fs.existsSync(readmePath)) {
    try {
      readme = fs.readFileSync(readmePath, "utf-8");
    } catch {}
  }

  const isOpenCode = summary.platform === "opencode";
  const base = isOpenCode ? path.join(pluginPath, ".opencode") : pluginPath;
  const commands = listFiles(path.join(base, "commands"), ".md");
  const skills = listDirs(path.join(base, "skills"));
  const agents = listFiles(path.join(base, "agents"), ".md");

  return {
    ...summary,
    readme,
    commands,
    skills,
    agents,
  };
}
