"use client";

import { useState, useCallback } from "react";
import { ChatPanel } from "./ChatPanel";
import { SessionSidebar } from "./SessionSidebar";
import { DashboardRibbon } from "./DashboardRibbon";
import type { PluginSummary, PluginFrontend, SessionMeta } from "@/lib/types";

type Platform = "claude-code" | "opencode";

export function HomeOrchestrator({
  plugins,
  frontends,
  pluginContext,
}: {
  plugins: PluginSummary[];
  frontends: PluginFrontend[];
  pluginContext: string;
}) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [chatKey, setChatKey] = useState(0);
  const [platform, setPlatform] = useState<Platform>("claude-code");
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();

  const handleSessionCreated = useCallback(
    (newSessionId: string) => {
      setSessionId(newSessionId);
      const title = `Home ${new Date().toLocaleTimeString()}`;
      fetch("/api/agent/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          session: {
            id: newSessionId,
            title,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            platform,
          },
        }),
      });
    },
    [platform]
  );

  function handleSelectSession(session: SessionMeta) {
    setSessionId(session.id);
    if (session.platform) {
      setPlatform(session.platform);
    }
    setPendingPrompt(undefined);
    setChatKey((k) => k + 1);
  }

  function handleNewSession() {
    setSessionId("");
    setPendingPrompt(undefined);
    setChatKey((k) => k + 1);
  }

  function switchPlatform(p: Platform) {
    if (p === platform) return;
    setPlatform(p);
    setSessionId("");
    setPendingPrompt(undefined);
    setChatKey((k) => k + 1);
  }

  function handleQuickAction(prompt: string) {
    setPendingPrompt(prompt);
    setSessionId("");
    setChatKey((k) => k + 1);
  }

  const statusDotColor =
    platform === "opencode" ? "bg-emerald-400" : "bg-orange-400";

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      {/* Dashboard Ribbon */}
      <DashboardRibbon
        plugins={plugins}
        frontends={frontends}
        onQuickAction={handleQuickAction}
      />

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle sessions"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Platform toggle */}
        <div className="flex items-center gap-1 rounded-full bg-secondary p-0.5">
          <button
            onClick={() => switchPlatform("claude-code")}
            className={
              platform === "claude-code"
                ? "rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400"
                : "px-2.5 py-0.5 text-xs text-muted-foreground hover:text-accent-foreground transition-colors"
            }
          >
            Claude Code
          </button>
          <button
            onClick={() => switchPlatform("opencode")}
            className={
              platform === "opencode"
                ? "rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400"
                : "px-2.5 py-0.5 text-xs text-muted-foreground hover:text-accent-foreground transition-colors"
            }
          >
            OpenCode
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusDotColor}`}></div>
          <span className="text-sm text-muted-foreground">
            {platform === "opencode" ? "OpenCode" : "Claude Code"}
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <SessionSidebar
            currentSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            platform={platform}
          />
        )}

        <div className="flex-1 overflow-hidden">
          <ChatPanel
            key={chatKey}
            sessionId={sessionId || undefined}
            systemPrompt={platform === "claude-code" ? pluginContext : undefined}
            initialPrompt={pendingPrompt}
            onSessionCreated={handleSessionCreated}
            platform={platform}
          />
        </div>
      </div>
    </div>
  );
}
