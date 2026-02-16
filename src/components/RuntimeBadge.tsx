"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AgentInstanceSummary } from "@/lib/types";

export function RuntimeBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/agents");
        if (!res.ok) return;
        const agents: AgentInstanceSummary[] = await res.json();
        if (!cancelled) {
          setCount(agents.filter((a) => a.status === "running").length);
        }
      } catch {
        // ignore
      }
    }

    poll();
    const interval = setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      href="/agents"
      className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs transition-colors hover:bg-secondary"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          count > 0
            ? "bg-emerald-400 shadow-[0_0_6px_1px] shadow-emerald-400/40"
            : "bg-zinc-500"
        }`}
      />
      <span className={count > 0 ? "text-foreground" : "text-muted-foreground"}>
        {count} agent{count !== 1 ? "s" : ""}
      </span>
    </Link>
  );
}
