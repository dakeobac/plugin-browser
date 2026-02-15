"use client";

import type { PluginSuggestion } from "@/lib/types";

const priorityStyles: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-accent/50 text-muted-foreground",
};

const typeLabels: Record<string, string> = {
  "pattern-extraction": "Pattern Extraction",
  "domain-expansion": "Domain Expansion",
  "pipeline-completion": "Pipeline Completion",
  "mcp-template": "MCP Template",
  "cross-domain": "Cross-Domain",
};

export function SuggestionCard({
  suggestion,
  onCreateClick,
}: {
  suggestion: PluginSuggestion;
  onCreateClick: (suggestion: PluginSuggestion) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${priorityStyles[suggestion.priority]}`}
            >
              {suggestion.priority}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {typeLabels[suggestion.type] || suggestion.type}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{suggestion.title}</h3>
        </div>
      </div>

      <p className="mb-2 text-sm text-muted-foreground">{suggestion.description}</p>

      <p className="mb-3 text-xs text-muted-foreground italic">
        {suggestion.rationale}
      </p>

      <div className="mb-3 text-xs text-muted-foreground">
        <span>Based on: </span>
        {suggestion.basedOn.map((name, i) => (
          <span key={name}>
            <span className="text-foreground">{name}</span>
            {i < suggestion.basedOn.length - 1 && ", "}
          </span>
        ))}
      </div>

      {/* Preview of suggested components */}
      <div className="mb-4 flex flex-wrap gap-2">
        {suggestion.suggestedCommands.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestion.suggestedCommands.map((cmd) => (
              <span
                key={cmd}
                className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                /{cmd}
              </span>
            ))}
          </div>
        )}
        {suggestion.suggestedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestion.suggestedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs text-blue-400"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
        {suggestion.hasMcp && (
          <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-xs text-purple-400">
            MCP
          </span>
        )}
        {suggestion.hasHooks && (
          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400">
            Hooks
          </span>
        )}
      </div>

      <button
        onClick={() => onCreateClick(suggestion)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Create Plugin
      </button>
    </div>
  );
}
