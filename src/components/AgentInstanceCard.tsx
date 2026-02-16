"use client";

import Link from "next/link";
import type { AgentInstanceSummary } from "@/lib/types";

const statusConfig: Record<string, { color: string; label: string; pulse?: boolean }> = {
  running: { color: "bg-green-500", label: "Running", pulse: true },
  idle: { color: "bg-amber-500", label: "Idle" },
  paused: { color: "bg-yellow-500", label: "Paused" },
  error: { color: "bg-red-500", label: "Error" },
  terminated: { color: "bg-zinc-500", label: "Terminated" },
};

function getUptime(startedAt?: string): string {
  if (!startedAt) return "";
  const ms = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function AgentInstanceCard({
  agent,
  onStop,
}: {
  agent: AgentInstanceSummary;
  onStop: (id: string) => void;
}) {
  const status = statusConfig[agent.status] || statusConfig.terminated;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/80">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {status.pulse && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${status.color} opacity-75`} />
              )}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status.color}`} />
            </span>
            <Link
              href={`/agents/${agent.id}`}
              className="text-sm font-medium text-foreground hover:text-blue-400 transition-colors truncate"
            >
              {agent.displayName}
            </Link>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {agent.agentName}
            {agent.pluginSlug && (
              <span className="ml-1 text-muted-foreground/60">
                from {agent.pluginSlug}
              </span>
            )}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            agent.runtime === "opencode"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-orange-500/20 text-orange-400"
          }`}
        >
          {agent.runtime === "opencode" ? "OC" : "CC"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{status.label}</span>
          {agent.startedAt && <span>{getUptime(agent.startedAt)}</span>}
        </div>
        <div className="flex items-center gap-1">
          {(agent.status === "running" || agent.status === "idle") && (
            <button
              onClick={() => onStop(agent.id)}
              className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Stop
            </button>
          )}
          <Link
            href={`/agents/${agent.id}`}
            className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}
