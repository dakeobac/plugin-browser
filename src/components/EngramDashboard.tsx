"use client";

import { useState, useCallback } from "react";
import { CommandBox } from "./CommandBox";
import { StatStrip } from "./StatStrip";
import { ActiveAgentsPanel } from "./ActiveAgentsPanel";
import { QuickLaunchPanel } from "./QuickLaunchPanel";
import { ActivityFeed } from "./ActivityFeed";
import { ChatPanel } from "./ChatPanel";
import Link from "next/link";
import type {
  AgentInstanceSummary,
  Team,
  Workflow,
  PluginSummary,
  ObservatoryStats,
  LogEntry,
  SessionMeta,
} from "@/lib/types";
import { SessionSidebar } from "./SessionSidebar";
import type { ConversationStarter } from "@/lib/chip-generator";

type Platform = "claude-code" | "opencode";
type DashboardView = "dashboard" | "orchestrator";

const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Engram Orchestrator — an AI assistant that helps users manage their development workbench.

You have access to MCP tools that let you dispatch background worker agents:

- dispatch_worker: Spawn a background Claude Code instance to handle a task autonomously. Workers run independently and the user gets notified when they complete.
- check_worker_status: Check on a specific worker's progress.
- list_workers: See all dispatched workers and their statuses.

When the user asks you to do something complex or time-consuming, consider breaking the work into independent tasks and dispatching workers for each. You can dispatch multiple workers in parallel.

For simple questions or quick tasks, respond directly without dispatching workers.

When you dispatch a worker, give it a clear, specific prompt that includes all the context it needs to complete the task independently.`;

// MCP server path is relative to project root (where npx tsx runs from).
// The API start route runs on the server where process.cwd() is the project root.
const ORCHESTRATOR_MCP_SERVERS = {
  orchestrator: {
    command: "npx",
    args: ["tsx", "src/scripts/orchestrator-mcp.ts"],
    env: { ENGRAM_URL: "http://localhost:3000" },
  },
};

interface EngramDashboardProps {
  agents: AgentInstanceSummary[];
  teams: Team[];
  workflows: Workflow[];
  installedPlugins: PluginSummary[];
  observatoryStats: ObservatoryStats;
  recentLogs: LogEntry[];
  starters?: ConversationStarter[];
}

export function EngramDashboard({
  agents,
  teams,
  workflows,
  installedPlugins,
  observatoryStats,
  recentLogs,
  starters,
}: EngramDashboardProps) {
  const agentsRunning = agents.filter((a) => a.status === "running").length;
  const teamsActive = teams.filter((t) => t.status === "active").length;

  const [view, setView] = useState<DashboardView>("dashboard");
  const [orchestratorSessionId, setOrchestratorSessionId] = useState<string | null>(null);
  const [orchestratorPlatform, setOrchestratorPlatform] = useState<Platform>("claude-code");
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleOrchestratorSubmit = useCallback((prompt: string, platform: Platform) => {
    setOrchestratorPlatform(platform);
    setInitialPrompt(prompt);
    setView("orchestrator");
  }, []);

  const handleOrchestratorSessionCreated = useCallback((sessionId: string) => {
    setOrchestratorSessionId(sessionId);
    // Persist to server session store
    fetch("/api/agent/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        session: {
          id: sessionId,
          title: "Orchestrator",
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          platform: orchestratorPlatform,
        },
      }),
    }).catch(() => {});
  }, [orchestratorPlatform]);

  const handleBackToDashboard = useCallback(() => {
    setView("dashboard");
    setInitialPrompt(undefined);
  }, []);

  const handleNewSession = useCallback(() => {
    setOrchestratorSessionId(null);
    setInitialPrompt(undefined);
    setChatKey((k) => k + 1);
  }, []);

  const handleSelectSession = useCallback((session: SessionMeta) => {
    setOrchestratorSessionId(session.id);
    setOrchestratorPlatform((session.platform as Platform) || "claude-code");
    setInitialPrompt(undefined);
    setChatKey((k) => k + 1);
    setView("orchestrator");
  }, []);

  if (view === "orchestrator") {
    const platformLabel = orchestratorPlatform === "opencode" ? "OpenCode" : "Claude Code";
    const platformColor = orchestratorPlatform === "opencode" ? "text-emerald-400" : "text-orange-400";

    return (
      <div className="flex" style={{ height: "calc(100vh - 73px)" }}>
        {showSidebar && (
          <SessionSidebar
            currentSessionId={orchestratorSessionId || ""}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        )}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSidebar((s) => !s)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Toggle sidebar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Dashboard
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${platformColor}`}>{platformLabel}</span>
              <button
                onClick={handleNewSession}
                className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                New Chat
              </button>
            </div>
          </div>

          {/* Full-height ChatPanel */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              key={chatKey}
              sessionId={orchestratorSessionId || undefined}
              initialPrompt={initialPrompt}
              onSessionCreated={handleOrchestratorSessionCreated}
              platform={orchestratorPlatform}
              systemPrompt={ORCHESTRATOR_SYSTEM_PROMPT}
              mcpServers={ORCHESTRATOR_MCP_SERVERS}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hero: Command Box */}
      <section className="dashboard-fade-up pt-4 sm:pt-8">
        <CommandBox teams={teams} starters={starters} onOrchestratorSubmit={handleOrchestratorSubmit} />
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
