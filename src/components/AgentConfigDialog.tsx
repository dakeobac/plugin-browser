"use client";

import { useState, useEffect } from "react";
import type { AgentRuntime, McpServerConfig } from "@/lib/types";

interface AgentConfigForm {
  agentName: string;
  displayName: string;
  runtime: AgentRuntime;
  cwd: string;
  systemPrompt: string;
  initialPrompt: string;
  maxTurns: number;
  mcpServerIds: string[];
}

export function AgentConfigDialog({
  onClose,
  onLaunch,
  prefillName,
  prefillCwd,
}: {
  onClose: () => void;
  onLaunch: (config: AgentConfigForm & { pluginSlug?: string }) => void;
  prefillName?: string;
  prefillCwd?: string;
  prefillSlug?: string;
}) {
  const [form, setForm] = useState<AgentConfigForm>({
    agentName: prefillName || "",
    displayName: prefillName || "",
    runtime: "claude-code",
    cwd: prefillCwd || "",
    systemPrompt: "",
    initialPrompt: "",
    maxTurns: 0,
    mcpServerIds: [],
  });
  const [launching, setLaunching] = useState(false);
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>([]);

  useEffect(() => {
    fetch("/api/connectors")
      .then((res) => res.json())
      .then((data) => setMcpServers(data))
      .catch(() => {});
  }, []);

  const canLaunch = form.agentName.trim().length > 0 && form.initialPrompt.trim().length > 0;

  function handleLaunch() {
    if (!canLaunch) return;
    setLaunching(true);
    onLaunch(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border bg-background shadow-2xl max-w-lg p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Launch Agent</h2>
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
          {/* Agent Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Agent Name
            </label>
            <input
              type="text"
              value={form.agentName}
              onChange={(e) => setForm({ ...form, agentName: e.target.value, displayName: e.target.value })}
              placeholder="my-agent"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Runtime toggle */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Runtime
            </label>
            <div className="flex gap-1 rounded-lg bg-card p-1">
              <button
                onClick={() => setForm({ ...form, runtime: "claude-code" })}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  form.runtime === "claude-code"
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-muted-foreground hover:text-accent-foreground"
                }`}
              >
                Claude Code
              </button>
              <button
                onClick={() => setForm({ ...form, runtime: "opencode" })}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  form.runtime === "opencode"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-muted-foreground hover:text-accent-foreground"
                }`}
              >
                OpenCode
              </button>
            </div>
          </div>

          {/* Working Directory */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Working Directory <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={form.cwd}
              onChange={(e) => setForm({ ...form, cwd: e.target.value })}
              placeholder="/path/to/project"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              System Prompt <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              placeholder="Custom instructions for the agent..."
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* Initial Prompt */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Initial Prompt
            </label>
            <textarea
              value={form.initialPrompt}
              onChange={(e) => setForm({ ...form, initialPrompt: e.target.value })}
              placeholder="What should this agent do?"
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* MCP Servers */}
          {mcpServers.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                MCP Servers <span className="text-muted-foreground">(optional)</span>
              </label>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-card p-2 space-y-1">
                {mcpServers.map((server) => (
                  <label key={server.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={form.mcpServerIds.includes(server.id)}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          mcpServerIds: e.target.checked
                            ? [...form.mcpServerIds, server.id]
                            : form.mcpServerIds.filter((id) => id !== server.id),
                        });
                      }}
                      className="rounded border-border"
                    />
                    <span className="truncate">{server.displayName}</span>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      server.source === "plugin" ? "bg-blue-500/20 text-blue-400" :
                      server.source === "settings" ? "bg-purple-500/20 text-purple-400" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>
                      {server.source}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Max Turns */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Max Turns <span className="text-muted-foreground">(0 = unlimited)</span>
            </label>
            <input
              type="number"
              value={form.maxTurns}
              onChange={(e) => setForm({ ...form, maxTurns: parseInt(e.target.value) || 0 })}
              min={0}
              className="w-32 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleLaunch}
              disabled={!canLaunch || launching}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {launching ? "Launching..." : "Launch Agent"}
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
