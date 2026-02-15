"use client";

import type { AiPattern, AiSuggestion } from "@/lib/types";

function SparkleIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
    </svg>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === "opencode") {
    return (
      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
        OpenCode
      </span>
    );
  }
  if (platform === "claude-code") {
    return (
      <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
        Claude Code
      </span>
    );
  }
  return (
    <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
      Both
    </span>
  );
}

const priorityColors: Record<string, string> = {
  high: "border-amber-500/30 bg-amber-500/5",
  medium: "border-violet-500/30 bg-violet-500/5",
  low: "border-border bg-card",
};

const priorityBadgeColors: Record<string, string> = {
  high: "bg-amber-500/20 text-amber-400",
  medium: "bg-violet-500/20 text-violet-400",
  low: "bg-secondary text-muted-foreground",
};

const typeColors: Record<string, string> = {
  command: "bg-blue-500/20 text-blue-400",
  structural: "bg-emerald-500/20 text-emerald-400",
  domain: "bg-purple-500/20 text-purple-400",
};

export function AiPatternCard({ pattern }: { pattern: AiPattern }) {
  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 transition-colors hover:border-violet-500/50">
      <div className="mb-2 flex items-center gap-2">
        <SparkleIcon />
        <h4 className="text-sm font-semibold text-foreground">{pattern.name}</h4>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[pattern.type] || typeColors.command}`}>
          {pattern.type}
        </span>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{pattern.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {pattern.plugins.map((name) => (
          <span key={name} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AiSuggestionCard({
  suggestion,
  onCreateClick,
}: {
  suggestion: AiSuggestion;
  onCreateClick?: (suggestion: AiSuggestion) => void;
}) {
  return (
    <div className={`rounded-lg border p-4 transition-colors hover:border-violet-500/50 ${priorityColors[suggestion.priority] || priorityColors.low}`}>
      <div className="mb-2 flex items-center gap-2">
        <SparkleIcon />
        <h4 className="text-sm font-semibold text-foreground">{suggestion.title}</h4>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadgeColors[suggestion.priority]}`}>
          {suggestion.priority}
        </span>
        <PlatformBadge platform={suggestion.platform} />
      </div>
      <p className="mb-2 text-sm text-muted-foreground">{suggestion.description}</p>
      <p className="mb-3 text-xs text-muted-foreground italic">{suggestion.rationale}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {suggestion.suggestedCommands.map((cmd) => (
          <span key={cmd} className="rounded-full bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground">
            /{cmd}
          </span>
        ))}
        {suggestion.suggestedSkills.map((skill) => (
          <span key={skill} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
            {skill}
          </span>
        ))}
      </div>
      {onCreateClick && (
        <button
          onClick={() => onCreateClick(suggestion)}
          className="rounded-md bg-violet-600/20 border border-violet-600/30 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-600/30"
        >
          Create Plugin
        </button>
      )}
    </div>
  );
}
