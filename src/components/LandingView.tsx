"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatPanel } from "./ChatPanel";
import { SessionSidebar } from "./SessionSidebar";
import type { SessionMeta } from "@/lib/types";

type Platform = "claude-code" | "opencode";

interface LandingViewProps {
  stats?: {
    pluginsDiscovered: number;
    patternsFound: number;
    suggestionsReady: number;
  };
}

const WORKFLOW_STEPS = [
  {
    num: 1,
    title: "Discover",
    desc: "Scans your filesystem for plugins",
    accent: "text-blue-500",
    accentBg: "bg-blue-500/10",
    href: "/discover",
    icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  },
  {
    num: 2,
    title: "Analyze",
    desc: "Detects patterns & ecosystem gaps",
    accent: "text-purple-500",
    accentBg: "bg-purple-500/10",
    href: "/discover?tab=patterns",
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
  },
  {
    num: 3,
    title: "Suggest",
    desc: "AI recommends what to build",
    accent: "text-amber-500",
    accentBg: "bg-amber-500/10",
    href: "/discover?tab=suggestions",
    icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
  },
  {
    num: 4,
    title: "Create",
    desc: "Scaffold from brief or suggestion",
    accent: "text-green-500",
    accentBg: "bg-green-500/10",
    href: null, // starts chat
    icon: "M12 4.5v15m7.5-7.5h-15",
  },
  {
    num: 5,
    title: "Build",
    desc: "AI implements in real-time",
    accent: "text-cyan-500",
    accentBg: "bg-cyan-500/10",
    href: "/agent",
    icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  },
  {
    num: 6,
    title: "Install",
    desc: "Ready in your marketplace",
    accent: "text-emerald-500",
    accentBg: "bg-emerald-500/10",
    href: "/plugins",
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

const QUICK_ACTIONS = [
  { label: "Scan my plugins", href: "/discover" },
  { label: "See AI suggestions", href: "/discover?tab=suggestions" },
  { label: "Browse marketplace", href: "/plugins" },
  { label: "Clone from GitHub", href: "/github" },
];

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const duration = 600;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span ref={ref} className="text-2xl font-bold text-blue-400">
        {display}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function LandingView({ stats }: LandingViewProps) {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [platform, setPlatform] = useState<Platform>("claude-code");
  const [sessionId, setSessionId] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [textareaValue, setTextareaValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [textareaValue]);

  function startChat(prompt: string) {
    setInitialPrompt(prompt);
    setHasStarted(true);
  }

  function handleSubmit() {
    const text = textareaValue.trim();
    if (!text) return;
    setTextareaValue("");
    startChat(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const handleSessionCreated = useCallback(
    (newSessionId: string) => {
      setSessionId(newSessionId);
      const title = `Session ${new Date().toLocaleTimeString()}`;
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
    setHasStarted(true);
    setInitialPrompt("");
    setChatKey((k) => k + 1);
  }

  function handleNewSession() {
    setSessionId("");
    setInitialPrompt("");
    setHasStarted(false);
    setChatKey((k) => k + 1);
  }

  function switchPlatform(p: Platform) {
    if (p === platform) return;
    setPlatform(p);
    if (hasStarted) {
      setSessionId("");
      setChatKey((k) => k + 1);
    }
  }

  const statusDotColor =
    platform === "opencode" ? "bg-emerald-400" : "bg-orange-400";

  // ─── Post-chat: full agent layout ───
  if (hasStarted) {
    return (
      <div className="flex h-[calc(100vh-73px)]">
        {showSidebar && (
          <SessionSidebar
            currentSessionId={sessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            platform={platform}
          />
        )}

        <div className="flex flex-1 flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-2">
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
              <div className={`h-2 w-2 rounded-full ${statusDotColor}`} />
              <span className="text-sm text-muted-foreground">
                {platform === "opencode" ? "OpenCode" : "Claude Code"}
              </span>
            </div>

            <div className="ml-auto">
              <button
                onClick={handleNewSession}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                New Chat
              </button>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              key={chatKey}
              initialPrompt={initialPrompt || undefined}
              sessionId={sessionId || undefined}
              onSessionCreated={handleSessionCreated}
              platform={platform}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Pre-chat: landing page ───
  return (
    <div className="min-h-[calc(100vh-73px)] overflow-y-auto px-6 pb-16">
      <div className="landing-fade-in mx-auto max-w-3xl">
        {/* Section A: Hero */}
        <div className="pt-12 sm:pt-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 mb-4">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            AI-Powered
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Build plugins from ideas
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Describe what you want. AI analyzes your ecosystem, scaffolds the
            structure, and implements every command, skill, and agent — from idea
            to installation in minutes.
          </p>

          {/* Stats row */}
          {stats && (
            <div className="mt-6 flex items-center justify-center gap-8 sm:gap-12">
              <AnimatedStat value={stats.pluginsDiscovered} label="Plugins Discovered" />
              <AnimatedStat value={stats.patternsFound} label="Patterns Found" />
              <AnimatedStat value={stats.suggestionsReady} label="Suggestions Ready" />
            </div>
          )}
        </div>

        {/* Section B: Workflow visualization */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {WORKFLOW_STEPS.map((step) => (
              <button
                key={step.num}
                onClick={() => {
                  if (step.href === null) {
                    // "Create" step — focus textarea
                    textareaRef.current?.focus();
                  } else {
                    router.push(step.href);
                  }
                }}
                className="workflow-card group relative flex flex-col items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center transition-colors hover:border-zinc-700 hover:bg-zinc-800/80"
              >
                {/* Step number */}
                <span className={`text-xs font-bold ${step.accent} opacity-60`}>
                  {String(step.num).padStart(2, "0")}
                </span>
                {/* Icon */}
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${step.accentBg}`}>
                  <svg
                    className={`h-4.5 w-4.5 ${step.accent}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-foreground">{step.title}</span>
                <span className="text-xs text-muted-foreground leading-tight">{step.desc}</span>
                {/* Connector dot on desktop */}
                {step.num < 6 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:block">
                    <div className="h-1 w-1 rounded-full bg-zinc-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Section C: Chat input CTA */}
        <div className="mt-10">
          <p className="mb-3 text-base font-medium text-foreground text-center">
            What plugin do you want to build?
          </p>
          <div className="landing-input-wrapper relative rounded-xl border border-border bg-card/80 shadow-lg shadow-black/20 transition-colors focus-within:border-border focus-within:bg-card">
            <textarea
              ref={textareaRef}
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="A plugin that audits my React components for accessibility issues..."
              rows={3}
              className="w-full resize-none bg-transparent px-4 pt-4 pb-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5">
              {/* Platform toggle */}
              <div className="flex items-center gap-1 rounded-full bg-secondary/80 p-0.5">
                <button
                  onClick={() => switchPlatform("claude-code")}
                  className={
                    platform === "claude-code"
                      ? "rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-medium text-orange-400 transition-colors"
                      : "rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-accent-foreground"
                  }
                >
                  Claude Code
                </button>
                <button
                  onClick={() => switchPlatform("opencode")}
                  className={
                    platform === "opencode"
                      ? "rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors"
                      : "rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-accent-foreground"
                  }
                >
                  OpenCode
                </button>
              </div>

              {/* Send */}
              <button
                onClick={handleSubmit}
                disabled={!textareaValue.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-all hover:bg-foreground/90 disabled:opacity-20 disabled:hover:bg-foreground"
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
                    d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Section D: Quick-start chips */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="landing-chip group flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3.5 py-2 text-sm text-muted-foreground transition-all hover:border-border hover:bg-secondary/80 hover:text-accent-foreground"
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
