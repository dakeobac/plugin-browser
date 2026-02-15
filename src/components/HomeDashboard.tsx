"use client";

import { useState } from "react";
import Link from "next/link";
import type { PluginSummary, PluginFrontend } from "@/lib/types";

function FeatureIcon({ type }: { type: string }) {
  const icons: Record<string, { d: string; label: string }> = {
    commands: {
      d: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      label: "Commands",
    },
    skills: {
      d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      label: "Skills",
    },
    agents: {
      d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      label: "Agents",
    },
    mcp: {
      d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      label: "MCP",
    },
    hooks: {
      d: "M13 10V3L4 14h7v7l9-11h-7z",
      label: "Hooks",
    },
  };
  const icon = icons[type];
  if (!icon) return null;
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={icon.label}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={icon.d} />
    </svg>
  );
}

function OpenFolderButtons({ pluginPath }: { pluginPath: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function openFolder(target: "finder" | "vscode") {
    setLoading(target);
    try {
      const res = await fetch("/api/plugins/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pluginPath, target }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Open folder failed:", data.error);
      }
    } catch (err) {
      console.error("Open folder error:", err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <button
        disabled={loading !== null}
        onClick={() => openFolder("finder")}
        className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        title="Open in Finder"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>
      <button
        disabled={loading !== null}
        onClick={() => openFolder("vscode")}
        className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        title="Open in VS Code"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      </button>
    </>
  );
}

export function HomeDashboard({
  plugins,
  frontends,
}: {
  plugins: PluginSummary[];
  frontends: PluginFrontend[];
}) {
  const installed = plugins.filter((p) => p.installInfo?.isInstalled);
  const enabled = installed.filter((p) => p.installInfo?.isEnabled);
  const withUpdates = installed.filter((p) => p.updateInfo?.hasUpdate);

  const frontendMap = new Map(frontends.map((f) => [f.slug, f]));

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{installed.length}</p>
          <p className="text-sm text-muted-foreground">Installed</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-green-400">{enabled.length}</p>
          <p className="text-sm text-muted-foreground">Enabled</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-blue-400">{withUpdates.length}</p>
          <p className="text-sm text-muted-foreground">Updates</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-purple-400">{frontends.length}</p>
          <p className="text-sm text-muted-foreground">Dashboards</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/plugins"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Browse All
        </Link>
        <Link
          href="/discover"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Discover
        </Link>
        <Link
          href="/agent"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Agent
        </Link>
        <Link
          href="/wiki"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Wiki
        </Link>
      </div>

      {/* Installed plugins */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Installed Plugins
        </h2>
        {installed.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No plugins installed yet.{" "}
              <Link href="/plugins" className="text-blue-400 hover:underline">
                Browse plugins
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {installed.map((plugin) => {
              const frontend = frontendMap.get(plugin.slug);
              return (
                <div
                  key={plugin.slug}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-border hover:bg-secondary/80"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Link
                      href={`/plugin/${plugin.slug}`}
                      className="text-sm font-semibold text-foreground hover:text-blue-400 transition-colors"
                    >
                      {plugin.name}
                    </Link>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        plugin.installInfo?.isEnabled
                          ? "bg-green-500/20 text-green-400"
                          : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {plugin.installInfo?.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  {plugin.version && (
                    <p className="mb-2 text-xs text-muted-foreground">v{plugin.version}</p>
                  )}
                  <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                    {plugin.description}
                  </p>

                  {/* Feature badges */}
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {plugin.hasCommands && (
                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                        <FeatureIcon type="commands" />
                        {plugin.commandCount}
                      </span>
                    )}
                    {plugin.hasSkills && (
                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                        <FeatureIcon type="skills" />
                        {plugin.skillCount}
                      </span>
                    )}
                    {plugin.hasAgents && (
                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                        <FeatureIcon type="agents" />
                        {plugin.agentCount}
                      </span>
                    )}
                    {plugin.hasMcp && (
                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                        <FeatureIcon type="mcp" />
                      </span>
                    )}
                    {plugin.hasHooks && (
                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                        <FeatureIcon type="hooks" />
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/plugin/${plugin.slug}`}
                      className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Details
                    </Link>
                    {plugin.updateInfo?.hasUpdate && (
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                        Update
                      </span>
                    )}
                    {frontend && (
                      <Link
                        href={`/home/frontend/${encodeURIComponent(plugin.slug)}`}
                        className="rounded bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/30"
                      >
                        Dashboard
                      </Link>
                    )}
                    <OpenFolderButtons pluginPath={plugin.pluginPath} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
