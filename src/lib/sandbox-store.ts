import fs from "fs";
import path from "path";
import os from "os";
import type { SandboxInstance } from "./types";

const STORE_FILE = path.join(os.homedir(), ".claude", "engram-sandboxes.json");

export function getSandboxStore(): SandboxInstance[] {
  try {
    if (!fs.existsSync(STORE_FILE)) return [];
    const data = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(data) as SandboxInstance[];
  } catch {
    return [];
  }
}

export function saveSandboxStore(sandboxes: SandboxInstance[]): void {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(sandboxes, null, 2));
}
