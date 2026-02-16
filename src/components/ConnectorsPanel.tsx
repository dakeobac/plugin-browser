"use client";

import { useState, useEffect, useCallback } from "react";
import type { McpServerConfig } from "@/lib/types";
import { McpServerCard } from "./McpServerCard";
import { AddMcpDialog } from "./AddMcpDialog";

type FilterSource = "all" | "plugin" | "settings" | "manual";

export function ConnectorsPanel({ initialServers }: { initialServers: McpServerConfig[] }) {
  const [servers, setServers] = useState(initialServers);
  const [filter, setFilter] = useState<FilterSource>("all");
  const [showAdd, setShowAdd] = useState(false);

  const refreshServers = useCallback(async () => {
    try {
      const res = await fetch("/api/connectors");
      if (res.ok) setServers(await res.json());
    } catch {
      // keep existing
    }
  }, []);

  // Refresh on mount in case server-rendered data is stale
  useEffect(() => {
    refreshServers();
  }, [refreshServers]);

  const filtered = filter === "all"
    ? servers
    : servers.filter((s) => s.source === filter);

  async function handleTest(server: McpServerConfig) {
    try {
      const res = await fetch("/api/connectors/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: server.command,
          args: server.args,
          env: server.env,
        }),
      });
      const result = await res.json();
      setServers((prev) =>
        prev.map((s) =>
          s.id === server.id
            ? { ...s, status: result.success ? "connected" as const : "error" as const, error: result.error, lastChecked: new Date().toISOString() }
            : s
        ),
      );
    } catch {
      // ignore
    }
  }

  async function handleRemove(id: string) {
    await fetch(`/api/connectors/${id}`, { method: "DELETE" });
    refreshServers();
  }

  async function handleAdd(config: {
    name: string;
    displayName: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    cwd?: string;
  }) {
    await fetch("/api/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setShowAdd(false);
    refreshServers();
  }

  const tabs: { value: FilterSource; label: string }[] = [
    { value: "all", label: "All" },
    { value: "plugin", label: "Plugin" },
    { value: "settings", label: "Settings" },
    { value: "manual", label: "Manual" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ml-1 text-xs opacity-60">
                  {servers.filter((s) => s.source === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Add Server
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "No MCP servers discovered" : `No ${filter} servers found`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a server manually or install a plugin with MCP support
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((server) => (
            <McpServerCard
              key={server.id}
              server={server}
              onTest={handleTest}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {showAdd && <AddMcpDialog onClose={() => setShowAdd(false)} onSave={handleAdd} />}
    </div>
  );
}
