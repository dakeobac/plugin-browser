"use client";

import { useState } from "react";

interface EnvEntry {
  key: string;
  value: string;
}

export function AddMcpDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (config: {
    name: string;
    displayName: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    cwd?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [cwd, setCwd] = useState("");
  const [envEntries, setEnvEntries] = useState<EnvEntry[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && command.trim().length > 0;

  function addEnvEntry() {
    setEnvEntries([...envEntries, { key: "", value: "" }]);
  }

  function updateEnvEntry(idx: number, field: "key" | "value", val: string) {
    const updated = [...envEntries];
    updated[idx][field] = val;
    setEnvEntries(updated);
  }

  function removeEnvEntry(idx: number) {
    setEnvEntries(envEntries.filter((_, i) => i !== idx));
  }

  function buildEnv(): Record<string, string> | undefined {
    const env: Record<string, string> = {};
    for (const entry of envEntries) {
      if (entry.key.trim()) {
        env[entry.key.trim()] = entry.value;
      }
    }
    return Object.keys(env).length > 0 ? env : undefined;
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/connectors/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: command.trim(),
          args: args.split(" ").filter(Boolean),
          env: buildEnv(),
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: "Test failed" });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    if (!canSave) return;
    setSaving(true);
    onSave({
      name: name.trim(),
      displayName: name.trim(),
      command: command.trim(),
      args: args.split(" ").filter(Boolean),
      env: buildEnv(),
      cwd: cwd.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border bg-background shadow-2xl max-w-lg p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Add MCP Server</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-accent-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-mcp-server"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Command</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="npx"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Arguments <span className="text-muted-foreground">(space-separated)</span>
            </label>
            <input
              type="text"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="-y @modelcontextprotocol/server-filesystem ."
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Working Directory <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="/path/to/project"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Env vars */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Environment Variables
              </label>
              <button
                onClick={addEnvEntry}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Add
              </button>
            </div>
            {envEntries.length === 0 && (
              <p className="text-xs text-muted-foreground">No environment variables</p>
            )}
            <div className="space-y-2">
              {envEntries.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.key}
                    onChange={(e) => updateEnvEntry(idx, "key", e.target.value)}
                    placeholder="KEY"
                    className="w-1/3 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateEnvEntry(idx, "value", e.target.value)}
                    placeholder="value"
                    className="flex-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                  <button
                    onClick={() => removeEnvEntry(idx)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`rounded-lg border p-3 text-sm ${
              testResult.success
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
              {testResult.success ? "Connection successful" : `Failed: ${testResult.error}`}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleTest}
              disabled={!command.trim() || testing}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
