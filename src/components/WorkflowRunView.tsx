"use client";

import type { WorkflowRun, WorkflowStep, WorkflowStepResult } from "@/lib/types";

const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending: "bg-muted text-muted-foreground border-border",
  skipped: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const statusDots: Record<string, string> = {
  completed: "bg-green-400",
  error: "bg-red-400",
  running: "bg-blue-400 animate-pulse",
  pending: "bg-zinc-500",
  skipped: "bg-amber-400",
};

export function WorkflowRunView({
  run,
  steps,
}: {
  run: WorkflowRun;
  steps: WorkflowStep[];
}) {
  return (
    <div className="space-y-4">
      {/* Run header */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-mono text-muted-foreground">{run.id}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs rounded-full px-2 py-0.5 ${
                statusColors[run.status] || statusColors.pending
              }`}>
                {run.status}
              </span>
              <span className="text-xs text-muted-foreground">
                Started {new Date(run.startedAt).toLocaleString()}
              </span>
              {run.completedAt && (
                <span className="text-xs text-muted-foreground">
                  · Completed {new Date(run.completedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
        {run.error && (
          <div className="mt-2 rounded-md bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-400">
            {run.error}
          </div>
        )}
      </div>

      {/* Step results */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Step Results</h4>
        {steps.map((step, i) => {
          const result = run.stepResults[step.id];
          const status = result?.status || "pending";

          return (
            <div key={step.id} className={`rounded-lg border p-3 ${statusColors[status] || ""} border-opacity-50`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${statusDots[status]}`} />
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/50 text-xs">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{step.name}</span>
                <span className="ml-auto text-xs opacity-70">{status}</span>
              </div>

              {result?.output && (
                <div className="mt-2 ml-9">
                  <details>
                    <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100">
                      View output
                    </summary>
                    <pre className="mt-1 rounded-md bg-background/50 p-2 text-xs overflow-x-auto max-h-40 overflow-y-auto">
                      {result.output}
                    </pre>
                  </details>
                </div>
              )}

              {result?.error && (
                <div className="mt-2 ml-9 text-xs opacity-80">
                  Error: {result.error}
                </div>
              )}

              {result?.startedAt && (
                <div className="mt-1 ml-9 text-xs opacity-50">
                  {new Date(result.startedAt).toLocaleTimeString()}
                  {result.completedAt && ` → ${new Date(result.completedAt).toLocaleTimeString()}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Blackboard state */}
      {Object.keys(run.blackboard).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Blackboard State</h4>
          <div className="space-y-1">
            {Object.entries(run.blackboard).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-xs">
                <span className="font-mono text-blue-400 shrink-0">{key}:</span>
                <span className="text-muted-foreground break-all">
                  {typeof value === "string" ? value.slice(0, 200) : JSON.stringify(value).slice(0, 200)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
