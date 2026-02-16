"use client";

import { useState } from "react";

interface SandboxConfigForm {
  template: string;
  timeout: number;
  cpu: number;
  memoryMB: number;
  persistent: boolean;
  envVars: { key: string; value: string }[];
}

const TEMPLATES = [
  { value: "base", label: "Base (Ubuntu)" },
  { value: "python", label: "Python 3.11" },
  { value: "node", label: "Node.js 20" },
  { value: "go", label: "Go 1.21" },
];

export function SandboxConfig({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (config: { template: string; timeout: number; resources: { cpu: number; memoryMB: number }; persistent: boolean; envVars?: Record<string, string> }) => void;
}) {
  const [form, setForm] = useState<SandboxConfigForm>({
    template: "base",
    timeout: 300,
    cpu: 2,
    memoryMB: 512,
    persistent: false,
    envVars: [],
  });
  const [creating, setCreating] = useState(false);

  function handleCreate() {
    setCreating(true);
    const envVars: Record<string, string> = {};
    form.envVars.forEach((e) => { if (e.key.trim()) envVars[e.key.trim()] = e.value; });
    onCreate({
      template: form.template,
      timeout: form.timeout,
      resources: { cpu: form.cpu, memoryMB: form.memoryMB },
      persistent: form.persistent,
      envVars: Object.keys(envVars).length > 0 ? envVars : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border bg-background shadow-2xl max-w-lg p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Create Sandbox</h2>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-accent-foreground">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Template</label>
            <select
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">CPU Cores</label>
              <select
                value={form.cpu}
                onChange={(e) => setForm({ ...form, cpu: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {[1, 2, 4, 8].map((v) => (
                  <option key={v} value={v}>{v} CPU</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Memory</label>
              <select
                value={form.memoryMB}
                onChange={(e) => setForm({ ...form, memoryMB: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {[256, 512, 1024, 2048, 4096].map((v) => (
                  <option key={v} value={v}>{v >= 1024 ? `${v / 1024} GB` : `${v} MB`}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Timeout <span className="text-muted-foreground">(seconds)</span>
            </label>
            <input
              type="number"
              value={form.timeout}
              onChange={(e) => setForm({ ...form, timeout: parseInt(e.target.value) || 300 })}
              min={60}
              max={3600}
              className="w-32 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.persistent}
              onChange={(e) => setForm({ ...form, persistent: e.target.checked })}
              className="rounded border-border"
            />
            Persistent sandbox (survives timeout)
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Sandbox"}
            </button>
            <button onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
