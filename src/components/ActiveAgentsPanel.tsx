"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AgentInstanceSummary } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const statusColors: Record<string, string> = {
  running: "bg-emerald-400 shadow-[0_0_6px_1px] shadow-emerald-400/40",
  idle: "bg-amber-400",
  paused: "bg-zinc-500",
  error: "bg-red-400",
  terminated: "bg-zinc-600",
};

export function ActiveAgentsPanel({ initialAgents }: { initialAgents: AgentInstanceSummary[] }) {
  const [agents, setAgents] = useState(initialAgents);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) return;
        const data: AgentInstanceSummary[] = await res.json();
        if (!cancelled) setAgents(data);
      } catch {
        // ignore
      }
    }

    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const liveAgents = agents.filter(
    (a) => a.status === "running" || a.status === "idle" || a.status === "paused"
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Active Agents</h3>
        <Link
          href="/agents"
          className="text-xs text-blue-400 transition-colors hover:text-blue-300"
        >
          View all &rarr;
        </Link>
      </div>

      {liveAgents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <svg
            className="h-10 w-10 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">No agents running</p>
          <Link
            href="/agents"
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
          >
            Launch Agent
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {liveAgents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-secondary/40"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusColors[agent.status] || statusColors.idle}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {agent.displayName}
                  </span>
                  {agent.pluginSlug && (
                    <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      {agent.pluginSlug}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {agent.status}
                </div>
              </div>
              {agent.startedAt && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(agent.startedAt)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
