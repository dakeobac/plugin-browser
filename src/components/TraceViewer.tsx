"use client";

import { useState, useEffect } from "react";
import type { AgentTrace, TraceSpan } from "@/lib/types";

export function TraceViewer({ traceId }: { traceId: string }) {
  const [trace, setTrace] = useState<(AgentTrace & { spans: TraceSpan[] }) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/observatory/traces/${traceId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Trace not found");
        return res.json();
      })
      .then(setTrace)
      .catch((err) => setError(err.message));
  }, [traceId]);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!trace) {
    return <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />;
  }

  const maxDuration = Math.max(...trace.spans.map((s) => s.durationMs), 1);

  return (
    <div className="space-y-4">
      {/* Trace header */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            trace.status === "completed" ? "bg-green-500/20 text-green-400" :
            trace.status === "error" ? "bg-red-500/20 text-red-400" :
            "bg-amber-500/20 text-amber-400"
          }`}>
            {trace.status}
          </span>
          <span className="text-sm font-medium text-foreground">{trace.agentName || trace.agentId}</span>
          <span className="text-xs text-muted-foreground">{trace.runtime}</span>
        </div>
        {trace.promptPreview && (
          <p className="mt-2 text-xs text-muted-foreground truncate">{trace.promptPreview}</p>
        )}
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          {trace.totalTokens !== undefined && <span>{trace.totalTokens.toLocaleString()} tokens</span>}
          {trace.totalCost !== undefined && <span>${trace.totalCost.toFixed(4)}</span>}
          <span>{new Date(trace.startedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Span waterfall */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Spans ({trace.spans.length})</h3>
        {trace.spans.length === 0 ? (
          <p className="text-xs text-muted-foreground">No spans recorded</p>
        ) : (
          trace.spans.map((span) => (
            <div key={span.spanId} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 truncate text-muted-foreground">{span.name}</span>
              <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                <div
                  className={`h-full rounded ${
                    span.status === "error" ? "bg-red-500/60" :
                    span.status === "completed" ? "bg-blue-500/60" :
                    "bg-amber-500/60"
                  }`}
                  style={{ width: `${Math.max((span.durationMs / maxDuration) * 100, 2)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-muted-foreground">
                {span.durationMs}ms
              </span>
            </div>
          ))
        )}
      </div>

      {trace.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {trace.error}
        </div>
      )}
    </div>
  );
}
