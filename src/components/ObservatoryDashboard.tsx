"use client";

import { useState, useEffect } from "react";
import type { ObservatoryStats } from "@/lib/types";
import { ActivityFeed } from "./ActivityFeed";
import { AgentHealthPanel } from "./AgentHealthPanel";
import { CostBreakdown } from "./CostBreakdown";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function ObservatoryDashboard({ initialStats }: { initialStats: ObservatoryStats }) {
  const [stats, setStats] = useState(initialStats);

  // Refresh every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/observatory");
        if (res.ok) setStats(await res.json());
      } catch { /* keep existing */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Traces"
          value={stats.totalTraces.toLocaleString()}
        />
        <StatCard
          label="Active Agents"
          value={String(stats.activeAgents)}
        />
        <StatCard
          label="Total Cost"
          value={`$${stats.totalCost.toFixed(4)}`}
          sub={`${stats.totalTokens.toLocaleString()} tokens`}
        />
        <StatCard
          label="Error Rate"
          value={`${(stats.errorRate * 100).toFixed(1)}%`}
        />
      </div>

      {/* Cost chart + Agent health */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Daily Cost</h3>
          <CostBreakdown costs={stats.costByDay} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Agent Activity</h3>
          <AgentHealthPanel agents={stats.tracesByAgent} />
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Activity</h3>
        <ActivityFeed logs={stats.recentActivity} />
      </div>
    </div>
  );
}
