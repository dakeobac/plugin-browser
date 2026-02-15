import fs from "fs";
import path from "path";
import os from "os";
import type { GitHubData } from "./types";

const dataDir = path.join(os.homedir(), ".claude", "plugin-browser");
const dataPath = path.join(dataDir, "github.json");

const defaultData: GitHubData = {
  accounts: [],
  repoCache: {},
};

export function loadGitHubData(): GitHubData {
  try {
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    return { ...defaultData };
  }
}

export function saveGitHubData(data: GitHubData): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}
