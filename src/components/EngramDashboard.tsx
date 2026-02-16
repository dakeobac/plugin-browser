"use client";

import { CommandBox } from "./CommandBox";
import { StatStrip } from "./StatStrip";
import { ActiveAgentsPanel } from "./ActiveAgentsPanel";
import { QuickLaunchPanel } from "./QuickLaunchPanel";
import { ActivityFeed } from "./ActivityFeed";
import Link from "next/link";
import type {
  AgentInstanceSummary,
  Team,
  Workflow,
  PluginSummary,
  ObservatoryStats,
  LogEntry,
} from "@/lib/types";

interface EngramDashboardProps {
  agents: AgentInstanceSummary[];
  teams: Team[];
  workflows: Workflow[];
  installedPlugins: PluginSummary[];
  observatoryStats: ObservatoryStats;
  recentLogs: LogEntry[];
}

export function EngramDashboard({
  agents,
  teams,
  workflows,
  installedPlugins,
  observatoryStats,
  recentLogs,
}: EngramDashboardProps) {
  const agentsRunning = agents.filter((a) => a.status === "running").length;
  const teamsActive = teams.filter((t) => t.status === "active").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero: Command Box */}
      <section className="dashboard-fade-up pt-4 sm:pt-8">
        <CommandBox teams={teams} />
      </section>

      {/* Stats Strip */}
      <section className="dashboard-fade-up" style={{ animationDelay: "0.05s" }}>
        <StatStrip
          agentsRunning={agentsRunning}
          teamsActive={teamsActive}
          pluginsInstalled={installedPlugins.length}
          tokensToday={observatoryStats.totalTokens}
        />
      </section>

      {/* Two-column panels */}
      <section
        className="grid gap-4 lg:grid-cols-2 dashboard-fade-up"
        style={{ animationDelay: "0.1s" }}
      >
        <ActiveAgentsPanel initialAgents={agents} />
        <QuickLaunchPanel teams={teams} workflows={workflows} />
      </section>

      {/* Activity Feed */}
      <section className="dashboard-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
            <Link
              href="/observatory"
              className="text-xs text-orange-400 transition-colors hover:text-orange-300"
            >
              Observatory &rarr;
            </Link>
          </div>
          <ActivityFeed logs={recentLogs} />
        </div>
      </section>
    </div>
  );
}
