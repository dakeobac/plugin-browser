"use client";

import type { SyncStatus } from "@/lib/types";

const statusConfig: Record<
  SyncStatus["state"],
  { bg: string; text: string; label: string }
> = {
  "up-to-date": { bg: "bg-green-500/20", text: "text-green-400", label: "Up to date" },
  ahead: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Ahead" },
  behind: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Behind" },
  diverged: { bg: "bg-red-500/20", text: "text-red-400", label: "Diverged" },
  "no-remote": { bg: "bg-accent", text: "text-muted-foreground", label: "No remote" },
  unknown: { bg: "bg-accent", text: "text-muted-foreground", label: "Unknown" },
};

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const config = statusConfig[status.state];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
      {status.state === "ahead" && status.ahead > 0 && (
        <span>+{status.ahead}</span>
      )}
      {status.state === "behind" && status.behind > 0 && (
        <span>-{status.behind}</span>
      )}
      {status.state === "diverged" && (
        <span>
          +{status.ahead}/-{status.behind}
        </span>
      )}
    </span>
  );
}
