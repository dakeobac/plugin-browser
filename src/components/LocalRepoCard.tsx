"use client";

import { useState } from "react";
import type { LocalGitRepo, SyncStatus } from "@/lib/types";
import { SyncStatusBadge } from "./SyncStatusBadge";

export function LocalRepoCard({ repo: initialRepo }: { repo: LocalGitRepo }) {
  const [repo, setRepo] = useState(initialRepo);
  const [checking, setChecking] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState("");

  async function handleCheckStatus() {
    setChecking(true);
    setPullMessage("");
    try {
      const res = await fetch("/api/github/local-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", path: repo.path }),
      });
      const data = await res.json();
      if (data.status) {
        setRepo((prev) => ({ ...prev, syncStatus: data.status as SyncStatus }));
      }
    } catch {
      // no-op
    }
    setChecking(false);
  }

  async function handlePull() {
    setPulling(true);
    setPullMessage("");
    try {
      const res = await fetch("/api/github/local-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pull", path: repo.path }),
      });
      const data = await res.json();
      if (data.success) {
        setPullMessage("Pull successful");
        // Re-check status
        await handleCheckStatus();
      } else {
        setPullMessage(`Pull failed: ${data.output}`);
      }
    } catch (err) {
      setPullMessage(
        `Error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    setPulling(false);
  }

  const shortPath = repo.path.replace(/^\/Users\/[^/]+/, "~");

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-border hover:bg-secondary/80">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {repo.name}
            </h3>
            {repo.isPlugin && (
              <span className="shrink-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                Plugin
              </span>
            )}
            {repo.isInMarketplace && (
              <span className="shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                In Marketplace
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{shortPath}</p>
        </div>
        <SyncStatusBadge status={repo.syncStatus} />
      </div>

      {/* Branch + remote info */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          {repo.currentBranch}
        </span>
        {repo.githubFullName && (
          <span className="text-muted-foreground">{repo.githubFullName}</span>
        )}
        {repo.syncStatus.lastChecked && (
          <span className="text-muted-foreground">
            checked{" "}
            {new Date(repo.syncStatus.lastChecked).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Pull message */}
      {pullMessage && (
        <p
          className={`mb-2 text-xs ${pullMessage.startsWith("Pull successful") ? "text-green-400" : "text-red-400"}`}
        >
          {pullMessage}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {checking ? "Checking..." : "Check Status"}
        </button>
        {(repo.syncStatus.state === "behind" ||
          repo.syncStatus.state === "diverged") && (
          <button
            onClick={handlePull}
            disabled={pulling}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            {pulling ? "Pulling..." : "Pull"}
          </button>
        )}
        {repo.githubFullName && (
          <a
            href={`https://github.com/${repo.githubFullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            View on GitHub
          </a>
        )}
      </div>
    </div>
  );
}
