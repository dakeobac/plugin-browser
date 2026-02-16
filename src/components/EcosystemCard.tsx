"use client";

import { useState } from "react";
import type { RegistryEntry } from "@/lib/types";

const platformColors = {
  "claude-code": "bg-orange-500/20 text-orange-400",
  opencode: "bg-emerald-500/20 text-emerald-400",
  both: "bg-purple-500/20 text-purple-400",
};

export function EcosystemCard({
  entry,
  onInstall,
}: {
  entry: RegistryEntry;
  onInstall: (entry: RegistryEntry) => void;
}) {
  const [installing, setInstalling] = useState(false);

  async function handleInstall() {
    setInstalling(true);
    try {
      onInstall(entry);
    } finally {
      // Parent handles the actual async operation
      setTimeout(() => setInstalling(false), 2000);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-blue-500/30 hover:bg-accent/50">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {entry.displayName}
            </h3>
            <span className="text-xs text-muted-foreground">v{entry.version}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{entry.author}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${platformColors[entry.platform]}`}>
          {entry.platform === "both" ? "Cross" : entry.platform === "claude-code" ? "CC" : "OC"}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
        {entry.description}
      </p>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
          {entry.tags.length > 4 && (
            <span className="text-xs text-muted-foreground">+{entry.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Stats & Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {entry.downloads !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {entry.downloads.toLocaleString()}
            </span>
          )}
          {entry.rating !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {entry.rating.toFixed(1)}
            </span>
          )}
          {entry.category && (
            <span>{entry.category}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {entry.repository && (
            <a
              href={`https://github.com/${entry.repository}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          )}
          <button
            onClick={handleInstall}
            disabled={installing}
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {installing ? "Installing..." : "Install"}
          </button>
        </div>
      </div>
    </div>
  );
}
