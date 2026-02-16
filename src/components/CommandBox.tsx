"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";

type Platform = "claude-code" | "opencode";

interface CommandBoxProps {
  teams: Team[];
}

const QUICK_ACTIONS = [
  { label: "Scan my plugins", href: "/discover" },
  { label: "Launch an agent", href: "/agents" },
  { label: "Browse marketplace", href: "/plugins" },
  { label: "Create a workflow", href: "/workflows" },
];

export function CommandBox({ teams }: CommandBoxProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [platform, setPlatform] = useState<Platform>("claude-code");
  const [target, setTarget] = useState<string>("chat"); // "chat" or team ID
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const teamMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (teamMenuRef.current && !teamMenuRef.current.contains(e.target as Node)) {
        setShowTeamMenu(false);
      }
    }
    if (showTeamMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTeamMenu]);

  function handleSubmit() {
    const text = value.trim();
    if (!text) return;

    if (target === "chat") {
      const params = new URLSearchParams({ prompt: text, platform });
      router.push(`/agent?${params.toString()}`);
    } else {
      // Start a team
      fetch(`/api/teams/${target}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      })
        .then(() => router.push(`/teams`))
        .catch(() => router.push(`/teams`));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const selectedTeam = teams.find((t) => t.id === target);
  const targetLabel = target === "chat" ? "Chat" : selectedTeam?.name || "Team";

  return (
    <div className="space-y-4">
      <h2 className="text-center text-lg font-medium text-foreground sm:text-xl">
        What should your agents work on?
      </h2>
      <p className="text-center text-sm text-muted-foreground">
        Launch a team, start a workflow, or ask a single agent. Your workbench handles the rest.
      </p>

      <div className="relative rounded-xl border border-border bg-card/80 shadow-lg shadow-black/20 transition-colors focus-within:border-zinc-600 focus-within:bg-card">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Run an SEO audit on acme-corp.com..."
          rows={3}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5">
          {/* Left: platform toggle */}
          <div className="flex items-center gap-1 rounded-full bg-secondary/80 p-0.5">
            <button
              onClick={() => setPlatform("claude-code")}
              className={
                platform === "claude-code"
                  ? "rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-medium text-orange-400 transition-colors"
                  : "rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-accent-foreground"
              }
            >
              Claude Code
            </button>
            <button
              onClick={() => setPlatform("opencode")}
              className={
                platform === "opencode"
                  ? "rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors"
                  : "rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-accent-foreground"
              }
            >
              OpenCode
            </button>
          </div>

          {/* Right: target selector + send */}
          <div className="flex items-center gap-2">
            {/* Team selector */}
            <div ref={teamMenuRef} className="relative">
              <button
                onClick={() => setShowTeamMenu(!showTeamMenu)}
                className="flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {targetLabel}
                <svg
                  className={`h-3 w-3 transition-transform ${showTeamMenu ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showTeamMenu && (
                <div className="absolute bottom-full right-0 z-50 mb-2 min-w-[140px] rounded-lg border border-border bg-popover p-1 shadow-lg shadow-black/20">
                  <button
                    onClick={() => { setTarget("chat"); setShowTeamMenu(false); }}
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                      target === "chat"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    Chat
                  </button>
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => { setTarget(team.id); setShowTeamMenu(false); }}
                      className={`block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                        target === team.id
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-all hover:bg-foreground/90 disabled:opacity-20 disabled:hover:bg-foreground"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Quick action chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="landing-chip flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3.5 py-2 text-sm text-muted-foreground transition-all hover:border-zinc-600 hover:bg-secondary/80 hover:text-accent-foreground"
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
