"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { AgentInstance, AgentLogEntry } from "@/lib/types";
import { ChatPanel } from "./ChatPanel";

const LOG_POLL_INTERVAL = 3000;

const levelColors: Record<string, string> = {
  info: "text-blue-400",
  warn: "text-amber-400",
  error: "text-red-400",
  debug: "text-zinc-500",
};

export function AgentDetailView({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<(AgentInstance & { logs: AgentLogEntry[] }) | null>(null);
  const [error, setError] = useState("");
  const [stopping, setStopping] = useState(false);

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      if (res.ok) {
        setAgent(await res.json());
      } else {
        setError("Agent not found");
      }
    } catch {
      setError("Failed to load agent");
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
    const interval = setInterval(fetchAgent, LOG_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAgent]);

  async function handleStop() {
    setStopping(true);
    await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    await fetchAgent();
    setStopping(false);
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-400">{error}</p>
          <Link href="/agents" className="mt-2 inline-block text-sm text-blue-400 hover:underline">
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  const statusColor =
    agent.status === "running" ? "text-green-400" :
    agent.status === "idle" ? "text-amber-400" :
    agent.status === "error" ? "text-red-400" :
    "text-zinc-400";

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Left panel: Chat */}
      <div className="flex flex-1 flex-col rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/agents" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h2 className="text-sm font-semibold text-foreground">{agent.displayName}</h2>
            <span className={`text-xs ${statusColor}`}>{agent.status}</span>
          </div>
          {(agent.status === "running" || agent.status === "idle") && (
            <button
              onClick={handleStop}
              disabled={stopping}
              className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {stopping ? "Stopping..." : "Stop"}
            </button>
          )}
        </div>
        <ChatPanel
          sessionId={agent.sessionId}
          cwd={agent.config.cwd}
          systemPrompt={agent.config.systemPrompt}
          platform={agent.runtime}
          apiEndpoint={{
            start: `/api/agents/${agentId}/prompt`,
            resume: `/api/agents/${agentId}/prompt`,
          }}
        />
      </div>

      {/* Right panel: Info + Logs */}
      <div className="flex w-80 flex-col gap-4 shrink-0">
        {/* Agent Info */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Agent Info</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Runtime</span>
              <span className={`font-medium ${
                agent.runtime === "opencode" ? "text-emerald-400" : "text-orange-400"
              }`}>
                {agent.runtime === "opencode" ? "OpenCode" : "Claude Code"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-medium ${statusColor}`}>{agent.status}</span>
            </div>
            {agent.sessionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session</span>
                <span className="font-mono text-muted-foreground truncate max-w-[140px]">
                  {agent.sessionId}
                </span>
              </div>
            )}
            {agent.config.cwd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CWD</span>
                <span className="font-mono text-muted-foreground truncate max-w-[140px]">
                  {agent.config.cwd.replace(/^\/Users\/[^/]+/, "~")}
                </span>
              </div>
            )}
            {agent.startedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started</span>
                <span className="text-muted-foreground">
                  {new Date(agent.startedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
            {agent.error && (
              <div className="rounded bg-red-500/10 p-2 text-red-400">
                {agent.error}
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="flex flex-1 flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Logs
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {agent.logs.length} entries
              </span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
            {agent.logs.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No logs yet</p>
            ) : (
              agent.logs.slice(-50).map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 font-mono text-muted-foreground/60">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`shrink-0 uppercase ${levelColors[log.level] || "text-zinc-400"}`}>
                    {log.level}
                  </span>
                  <span className="text-muted-foreground break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
