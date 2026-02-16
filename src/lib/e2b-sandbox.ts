import type { E2BSandboxConfig, SandboxInstance } from "./types";
import { getSandboxStore, saveSandboxStore } from "./sandbox-store";

/**
 * Check if E2B is available (API key configured).
 */
export function isE2BAvailable(): boolean {
  return Boolean(process.env.E2B_API_KEY);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Dynamically import E2B SDK. Returns null if not available.
 * Uses indirect require to avoid TypeScript module resolution errors when e2b is not installed.
 */
async function getE2B(): Promise<{ Sandbox: any } | null> {
  if (!isE2BAvailable()) return null;
  try {
    // Dynamic import with variable to bypass TypeScript static analysis
    const moduleName = "e2b";
    const mod = await import(/* webpackIgnore: true */ moduleName);
    return { Sandbox: mod.Sandbox };
  } catch {
    return null;
  }
}

function generateId(): string {
  return `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new E2B sandbox.
 */
export async function createSandbox(config: E2BSandboxConfig): Promise<SandboxInstance> {
  const e2b = await getE2B();
  if (!e2b) {
    throw new Error("E2B is not available. Set E2B_API_KEY environment variable.");
  }

  const instance: SandboxInstance = {
    id: generateId(),
    sandboxId: "",
    config,
    status: "creating",
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  try {
    const sandbox = await e2b.Sandbox.create(config.template, {
      timeoutMs: config.timeout * 1000,
      envs: config.envVars,
    });

    instance.sandboxId = sandbox.sandboxId;
    instance.status = "running";
    instance.url = `https://${sandbox.sandboxId}.e2b.dev`;

    const store = getSandboxStore();
    store.push(instance);
    saveSandboxStore(store);

    return instance;
  } catch (err) {
    instance.status = "error";
    instance.error = (err as Error).message;

    const store = getSandboxStore();
    store.push(instance);
    saveSandboxStore(store);

    throw err;
  }
}

/**
 * Execute a command in a sandbox and yield output lines.
 */
export async function* execInSandbox(
  sandboxId: string,
  command: string,
): AsyncGenerator<{ type: "stdout" | "stderr" | "exit"; data: string }> {
  const e2b = await getE2B();
  if (!e2b) throw new Error("E2B is not available");

  const sandbox = await e2b.Sandbox.connect(sandboxId);

  const result = await sandbox.commands.run(command);

  if (result.stdout) {
    yield { type: "stdout", data: result.stdout };
  }
  if (result.stderr) {
    yield { type: "stderr", data: result.stderr };
  }
  yield { type: "exit", data: String(result.exitCode) };
}

/**
 * Destroy a sandbox.
 */
export async function destroySandbox(sandboxId: string): Promise<void> {
  const e2b = await getE2B();
  if (!e2b) throw new Error("E2B is not available");

  const sandbox = await e2b.Sandbox.connect(sandboxId);
  await sandbox.kill();

  const store = getSandboxStore();
  const idx = store.findIndex((s) => s.sandboxId === sandboxId);
  if (idx >= 0) {
    store[idx].status = "stopped";
    store[idx].lastActiveAt = new Date().toISOString();
    saveSandboxStore(store);
  }
}

/**
 * List all tracked sandboxes.
 */
export function listSandboxes(): SandboxInstance[] {
  return getSandboxStore();
}

/**
 * Get a sandbox by ID.
 */
export function getSandbox(id: string): SandboxInstance | undefined {
  return getSandboxStore().find((s) => s.id === id);
}
