"use client";

import { useState, useEffect } from "react";
import type { SessionMeta } from "@/lib/types";

type Platform = "claude-code" | "opencode";

export function SessionSidebar({
  currentSessionId,
  onSelectSession,
  onNewSession,
  platform,
}: {
  currentSessionId: string;
  onSelectSession: (session: SessionMeta) => void;
  onNewSession: () => void;
  platform?: Platform;
}) {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter sessions by platform if specified
  const filteredSessions = platform
    ? sessions.filter((s) => {
        // Sessions without platform field are assumed to be claude-code
        const sp = s.platform || "claude-code";
        return sp === platform;
      })
    : sessions;

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch("/api/agent/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", session: { id } }),
    });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function platformBadge(session: SessionMeta) {
    const sp = session.platform || "claude-code";
    if (sp === "opencode") {
      return (
        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
          OC
        </span>
      );
    }
    return (
      <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
        CC
      </span>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-background">
      <div className="border-b border-border p-3">
        <button
          onClick={onNewSession}
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          New Session
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No sessions yet
          </div>
        ) : (
          <ul className="space-y-0.5 p-2">
            {filteredSessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSelectSession(session)}
                  className={`group flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                    currentSessionId === session.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {platformBadge(session)}
                      <p className="truncate text-sm font-medium">
                        {session.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(session.lastUsedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
