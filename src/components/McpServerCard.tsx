"use client";

import { useState } from "react";
import type { McpServerConfig } from "@/lib/types";

const sourceStyles: Record<string, { bg: string; text: string; label: string }> = {
  plugin: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Plugin" },
  settings: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Settings" },
  manual: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Manual" },
};

const statusDot: Record<string, string> = {
  connected: "bg-green-500",
  disconnected: "bg-zinc-500",
  error: "bg-red-500",
  unknown: "bg-zinc-600",
};

export function McpServerCard({
  server,
  onTest,
  onRemove,
}: {
  server: McpServerConfig;
  onTest: (server: McpServerConfig) => void;
  onRemove: (id: string) => void;
}) {
  const [testing, setTesting] = useState(false);
  const source = sourceStyles[server.source] || sourceStyles.manual;

  async function handleTest() {
    setTesting(true);
    onTest(server);
    setTesting(false);
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/80">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusDot[server.status] || statusDot.unknown}`} />
            <span className="text-sm font-medium text-foreground truncate">
              {server.displayName}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${source.bg} ${source.text}`}>
              {source.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <pre className="rounded bg-zinc-950 px-2 py-1 text-xs text-muted-foreground overflow-x-auto">
          {server.command} {server.args.join(" ")}
        </pre>
      </div>

      {server.error && (
        <p className="mt-2 text-xs text-red-400 truncate">{server.error}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
        >
          {testing ? "Testing..." : "Test"}
        </button>
        {server.source === "manual" && (
          <button
            onClick={() => onRemove(server.id)}
            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
