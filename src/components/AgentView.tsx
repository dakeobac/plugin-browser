"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPanel } from "./ChatPanel";
import { SessionSidebar } from "./SessionSidebar";
import type { SessionMeta } from "@/lib/types";

type Platform = "claude-code" | "opencode";

export function AgentView() {
  const searchParams = useSearchParams();
  const pluginName = searchParams.get("plugin");
  const cwd = searchParams.get("cwd") || undefined;

  const [showSidebar, setShowSidebar] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [chatKey, setChatKey] = useState(0); // force remount ChatPanel
  const [platform, setPlatform] = useState<Platform>("claude-code");
  const [e2bAvailable, setE2bAvailable] = useState(false);

  useEffect(() => {
    fetch("/api/sandboxes")
      .then((res) => res.json())
      .then((data) => setE2bAvailable(data.available === true))
      .catch(() => {});
  }, []);

  const systemPrompt = pluginName
    ? `You are working with the Claude Code plugin "${pluginName}". ${
        cwd ? `The plugin is located at ${cwd}.` : ""
      } Help the user with development, debugging, or any questions about this plugin.`
    : undefined;

  const handleSessionCreated = useCallback(
    (newSessionId: string) => {
      setSessionId(newSessionId);
      // Save session
      const title = pluginName
        ? `Plugin: ${pluginName}`
        : `Session ${new Date().toLocaleTimeString()}`;
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
            pluginContext: pluginName || undefined,
            platform,
          },
        }),
      });
    },
    [pluginName, platform]
  );

  function handleSelectSession(session: SessionMeta) {
    setSessionId(session.id);
    // Switch platform to match the session
    if (session.platform) {
      setPlatform(session.platform);
    }
    setChatKey((k) => k + 1);
  }

  function handleNewSession() {
    setSessionId("");
    setChatKey((k) => k + 1);
  }

  function switchPlatform(p: Platform) {
    if (p === platform) return;
    setPlatform(p);
    // Reset session when switching platform
    setSessionId("");
    setChatKey((k) => k + 1);
  }

  const statusDotColor = platform === "opencode" ? "bg-emerald-400" : "bg-orange-400";

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Sidebar toggle */}
      {showSidebar && (
        <SessionSidebar
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          platform={platform}
        />
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Toggle sessions"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
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
            {e2bAvailable && (
              <span className="px-2.5 py-0.5 text-xs text-cyan-400/50 cursor-default" title="E2B sandboxes available via Agents page">
                Cloud (E2B)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusDotColor}`}></div>
            <span className="text-sm text-muted-foreground">
              {platform === "opencode" ? "OpenCode" : "Claude Code"}
            </span>
          </div>

          {pluginName && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
              {pluginName}
            </span>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            key={chatKey}
            sessionId={sessionId || undefined}
            cwd={cwd}
            systemPrompt={platform === "claude-code" ? systemPrompt : undefined}
            onSessionCreated={handleSessionCreated}
            platform={platform}
          />
        </div>
      </div>
    </div>
  );
}
