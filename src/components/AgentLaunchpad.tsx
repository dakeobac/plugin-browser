"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { AgentInstanceSummary, PluginSummary } from "@/lib/types";
import { AgentInstanceCard } from "./AgentInstanceCard";
import { AgentConfigDialog } from "./AgentConfigDialog";

const POLL_INTERVAL = 5000;

export function AgentLaunchpad({ plugins }: { plugins: PluginSummary[] }) {
  const searchParams = useSearchParams();
  const launchSlug = searchParams.get("launch");

  const [agents, setAgents] = useState<AgentInstanceSummary[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [prefillName, setPrefillName] = useState("");
  const [prefillCwd, setPrefillCwd] = useState("");
  const [prefillSlug, setPrefillSlug] = useState("");

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch {
      // Network error — keep existing state
    }
  }, []);

  // Poll for agent list
  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  // Handle ?launch=slug query param
  useEffect(() => {
    if (launchSlug) {
      const plugin = plugins.find((p) => p.slug === launchSlug);
      if (plugin) {
        setPrefillName(plugin.name);
        setPrefillCwd(plugin.pluginPath);
        setPrefillSlug(plugin.slug);
        setShowConfig(true);
      }
    }
  }, [launchSlug, plugins]);

  async function handleStop(id: string) {
    await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    fetchAgents();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    fetchAgents();
  }

  async function handleLaunch(config: {
    agentName: string;
    displayName: string;
    runtime: string;
    cwd: string;
    systemPrompt: string;
    initialPrompt: string;
    maxTurns: number;
  }) {
    setShowConfig(false);
    // Fire-and-forget — the agent will appear in the poll
    fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentName: config.agentName,
        displayName: config.displayName,
        prompt: config.initialPrompt,
        pluginSlug: prefillSlug || undefined,
        runtime: config.runtime,
        cwd: config.cwd || undefined,
        systemPrompt: config.systemPrompt || undefined,
        maxTurns: config.maxTurns || undefined,
      }),
    }).then(() => {
      // Refresh quickly after launch
      setTimeout(fetchAgents, 500);
    });
  }

  const running = agents.filter((a) => a.status === "running" || a.status === "idle");
  const stopped = agents.filter((a) => a.status !== "running" && a.status !== "idle");

  const pluginsWithAgents = plugins.filter((p) => p.hasAgents);

  return (
    <div className="space-y-8">
      {/* Running Agents */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Active Agents
            {running.length > 0 && (
              <span className="ml-2 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                {running.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => {
              setPrefillName("");
              setPrefillCwd("");
              setPrefillSlug("");
              setShowConfig(true);
            }}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Launch New Agent
          </button>
        </div>

        {running.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No active agents</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Launch an agent to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {running.map((agent) => (
              <AgentInstanceCard key={agent.id} agent={agent} onStop={handleStop} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Launch from Plugins */}
      {pluginsWithAgents.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Launch from Plugin
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pluginsWithAgents.map((plugin) => (
              <button
                key={plugin.slug}
                onClick={() => {
                  setPrefillName(plugin.name);
                  setPrefillCwd(plugin.pluginPath);
                  setPrefillSlug(plugin.slug);
                  setShowConfig(true);
                }}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/80"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-foreground">{plugin.name}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {plugin.agentCount} agent{plugin.agentCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {plugin.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Stopped / Terminated Agents */}
      {stopped.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            History
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {stopped.length} agent{stopped.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stopped.map((agent) => (
              <div key={agent.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      agent.status === "error" ? "bg-red-500" : "bg-zinc-500"
                    }`} />
                    <span className="text-sm text-muted-foreground">{agent.displayName}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Config Dialog */}
      {showConfig && (
        <AgentConfigDialog
          onClose={() => setShowConfig(false)}
          onLaunch={handleLaunch}
          prefillName={prefillName}
          prefillCwd={prefillCwd}
          prefillSlug={prefillSlug}
        />
      )}
    </div>
  );
}
