"use client";

import Link from "next/link";
import { useAgents } from "@/hooks/use-queries";

export function RuntimeBadge() {
  const { data: agents = [] } = useAgents();
  const count = agents.filter((a) => a.status === "running").length;

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
