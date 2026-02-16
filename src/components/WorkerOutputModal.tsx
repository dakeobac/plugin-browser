"use client";

import { useState, useEffect } from "react";
import type { AgentLogEntry } from "@/lib/types";

interface WorkerDetail {
  id: string;
  agentName: string;
  displayName: string;
  status: string;
  runtime: string;
  startedAt?: string;
  lastActivity?: string;
  sessionId?: string;
  error?: string;
  recentLogs: AgentLogEntry[];
}

export function WorkerOutputModal({
  agentId,
  onClose,
}: {
  agentId: string;
  onClose: () => void;
}) {
  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/orchestrator/workers/${agentId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setWorker(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [agentId]);

  const statusColor = worker?.status === "idle"
    ? "text-green-400"
    : worker?.status === "running"
    ? "text-blue-400"
    : worker?.status === "error"
    ? "text-red-400"
    : "text-muted-foreground";

  const statusLabel = worker?.status === "idle" ? "Completed" : worker?.status || "Unknown";

  function formatDuration(startedAt?: string, lastActivity?: string): string {
    if (!startedAt) return "—";
    const start = new Date(startedAt).getTime();
    const end = lastActivity ? new Date(lastActivity).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 flex h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {worker?.displayName || "Worker Output"}
            </h3>
            {worker && (
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className={statusColor}>{statusLabel}</span>
                <span>{worker.runtime}</span>
                <span>{formatDuration(worker.startedAt, worker.lastActivity)}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading worker output...</p>
            </div>
          ) : !worker ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Worker not found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error banner */}
              {worker.error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-sm font-medium text-red-400">Error</p>
                  <p className="mt-1 text-xs text-red-300">{worker.error}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</h4>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <dt className="text-muted-foreground">Agent ID</dt>
                  <dd className="font-mono text-foreground">{worker.id}</dd>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="text-foreground">{worker.agentName}</dd>
                  <dt className="text-muted-foreground">Started</dt>
                  <dd className="text-foreground">{worker.startedAt ? new Date(worker.startedAt).toLocaleString() : "—"}</dd>
                  <dt className="text-muted-foreground">Last Activity</dt>
                  <dd className="text-foreground">{worker.lastActivity ? new Date(worker.lastActivity).toLocaleString() : "—"}</dd>
                  {worker.sessionId && (
                    <>
                      <dt className="text-muted-foreground">Session</dt>
                      <dd className="font-mono text-foreground truncate">{worker.sessionId}</dd>
                    </>
                  )}
                </dl>
              </div>

              {/* Logs */}
              <div>
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Activity Log ({worker.recentLogs.length} entries)
                </h4>
                {worker.recentLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No log entries recorded.</p>
                ) : (
                  <div className="space-y-1 rounded-lg border border-border bg-card p-3 max-h-[40vh] overflow-y-auto">
                    {worker.recentLogs.map((log, i) => {
                      const levelColor =
                        log.level === "error" ? "text-red-400" :
                        log.level === "warn" ? "text-amber-400" :
                        log.level === "info" ? "text-blue-400" :
                        "text-muted-foreground";
                      return (
                        <div key={i} className="flex items-start gap-2 text-xs font-mono">
                          <span className="shrink-0 text-muted-foreground/60">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`shrink-0 w-10 uppercase ${levelColor}`}>
                            {log.level}
                          </span>
                          <span className="text-foreground">{log.message}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
