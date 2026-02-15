"use client";

import type { PluginSummary, PluginFrontend } from "@/lib/types";

const QUICK_ACTIONS = [
  {
    label: "Create Plugin",
    prompt:
      "Help me create a new Claude Code plugin. Ask me what I want it to do.",
  },
  {
    label: "Audit Plugins",
    prompt:
      "Review my installed plugins and suggest improvements, identify unused plugins, or potential conflicts.",
  },
  {
    label: "Check Updates",
    prompt:
      "Check which of my installed plugins have updates available and summarize what changed.",
  },
  {
    label: "Plugin Ideas",
    prompt:
      "Based on my installed plugins and their patterns, suggest new plugin ideas that would complement my workflow.",
  },
  {
    label: "Create from Brief",
    prompt:
      "I have a design brief for a new plugin. Help me parse it and create the plugin from it.",
  },
];

export function DashboardRibbon({
  plugins,
  frontends,
  onQuickAction,
}: {
  plugins: PluginSummary[];
  frontends: PluginFrontend[];
  onQuickAction: (prompt: string) => void;
}) {
  const installed = plugins.filter((p) => p.installInfo?.isInstalled);
  const enabled = installed.filter((p) => p.installInfo?.isEnabled);
  const withUpdates = installed.filter((p) => p.updateInfo?.hasUpdate);

  return (
    <div className="shrink-0 border-b border-border bg-background px-4 py-3 space-y-2.5">
      {/* Row 1: Title + stat pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-foreground">
          Plugin Factory
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
            {installed.length} installed
          </span>
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
            {enabled.length} enabled
          </span>
          {withUpdates.length > 0 && (
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              {withUpdates.length} update{withUpdates.length !== 1 ? "s" : ""}
            </span>
          )}
          {frontends.length > 0 && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
              {frontends.length} dashboard{frontends.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Quick actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.prompt)}
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Row 3: Installed plugin chips (horizontal scroll) */}
      {installed.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5">
          {installed.map((plugin) => (
            <button
              key={plugin.slug}
              onClick={() =>
                onQuickAction(
                  `Tell me about the ${plugin.name} plugin and what it provides.`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-accent-foreground shrink-0"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  plugin.installInfo?.isEnabled
                    ? "bg-green-400"
                    : "bg-zinc-600"
                }`}
              />
              {plugin.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
