"use client";

import type { LogEntry } from "@/lib/types";

const levelColors: Record<string, string> = {
  info: "bg-blue-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  debug: "bg-zinc-600",
};

export function ActivityFeed({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-2 text-xs">
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${levelColors[log.level] || levelColors.debug}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{log.source}</span>
              <span className="text-muted-foreground">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-muted-foreground truncate">{log.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
