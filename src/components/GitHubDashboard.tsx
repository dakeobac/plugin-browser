"use client";

import { useState, useEffect } from "react";
import type { GitHubAccount, GitHubRepo, LocalGitRepo } from "@/lib/types";
import type { MarketplaceSource } from "../../marketplace.config";
import { GitHubRepoCard } from "./GitHubRepoCard";
import { LocalRepoCard } from "./LocalRepoCard";
import { CloneDialog } from "./CloneDialog";

type Tab = "accounts" | "search" | "repos" | "local";

const tabs: { id: Tab; label: string }[] = [
  { id: "accounts", label: "Accounts" },
  { id: "search", label: "Plugin Search" },
  { id: "repos", label: "Repos" },
  { id: "local", label: "Local Sync" },
];

export function GitHubDashboard({
  initialGhInstalled,
  initialAccounts,
  initialLocalRepos,
  marketplaces,
}: {
  initialGhInstalled: boolean;
  initialAccounts: GitHubAccount[];
  initialLocalRepos: LocalGitRepo[];
  marketplaces: MarketplaceSource[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [ghInstalled, setGhInstalled] = useState(initialGhInstalled);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [refreshingAccounts, setRefreshingAccounts] = useState(false);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GitHubRepo[]>([]);
  const [searching, setSearching] = useState(false);
  const [quickCloneUrl, setQuickCloneUrl] = useState("");

  // Repos tab state
  const [selectedAccount, setSelectedAccount] = useState(
    accounts[0]?.username || ""
  );
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [languageFilter, setLanguageFilter] = useState("");

  // Local sync tab state
  const [localRepos, setLocalRepos] = useState(initialLocalRepos);
  const [checkingAll, setCheckingAll] = useState(false);

  // Clone dialog state
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [clonePrefill, setClonePrefill] = useState<GitHubRepo | null>(null);

  // Load default plugin search on mount
  useEffect(() => {
    if (ghInstalled && accounts.length > 0) {
      handleSearch("claude-plugin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefreshAccounts() {
    setRefreshingAccounts(true);
    try {
      const res = await fetch("/api/github/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });
      const data = await res.json();
      setGhInstalled(data.ghInstalled);
      setAccounts(data.accounts);
      if (data.accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(data.accounts[0].username);
      }
    } catch {
      // no-op
    }
    setRefreshingAccounts(false);
  }

  async function handleSearch(query?: string) {
    const q = query || searchQuery || "claude-plugin";
    setSearching(true);
    try {
      const res = await fetch(
        `/api/github/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setSearchResults(data.repos || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }

  async function handleLoadRepos(username?: string) {
    const user = username || selectedAccount;
    if (!user) return;
    setLoadingRepos(true);
    try {
      const res = await fetch(
        `/api/github/repos?username=${encodeURIComponent(user)}`
      );
      const data = await res.json();
      setRepos(data.repos || []);
    } catch {
      setRepos([]);
    }
    setLoadingRepos(false);
  }

  function handleCloneFromCard(repo: GitHubRepo) {
    setClonePrefill(repo);
    setCloneDialogOpen(true);
  }

  function handleQuickClone() {
    if (!quickCloneUrl.trim()) return;
    setClonePrefill(null);
    setCloneDialogOpen(true);
  }

  async function handleCheckAllSync() {
    setCheckingAll(true);
    // Check each repo sequentially to avoid overwhelming the system
    for (let i = 0; i < localRepos.length; i++) {
      try {
        const res = await fetch("/api/github/local-repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync", path: localRepos[i].path }),
        });
        const data = await res.json();
        if (data.status) {
          setLocalRepos((prev) =>
            prev.map((r, idx) =>
              idx === i ? { ...r, syncStatus: data.status } : r
            )
          );
        }
      } catch {
        // skip
      }
    }
    setCheckingAll(false);
  }

  // Compute unique languages for filter
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))] as string[];
  const filteredRepos = languageFilter
    ? repos.filter((r) => r.language === languageFilter)
    : repos;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">GitHub</h2>
          <p className="text-sm text-muted-foreground">
            {ghInstalled ? (
              <>
                {accounts.length} authenticated account
                {accounts.length !== 1 ? "s" : ""}
                {" \u00B7 "}
                {localRepos.length} local repos with GitHub remotes
              </>
            ) : (
              "GitHub CLI not detected"
            )}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              // Auto-load repos when switching to repos tab
              if (tab.id === "repos" && repos.length === 0 && selectedAccount) {
                handleLoadRepos();
              }
            }}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              {tab.id === "accounts"
                ? accounts.length
                : tab.id === "search"
                  ? searchResults.length
                  : tab.id === "repos"
                    ? repos.length
                    : localRepos.length}
            </span>
          </button>
        ))}
      </div>

      {/* ====== ACCOUNTS TAB ====== */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          {!ghInstalled ? (
            <GitHubSetupGuide />
          ) : accounts.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <h3 className="mb-1 text-sm font-semibold text-amber-400">
                  No accounts found
                </h3>
                <p className="text-sm text-muted-foreground">
                  GitHub CLI is installed but no accounts are authenticated. Run:
                </p>
                <code className="mt-2 block rounded bg-secondary px-3 py-2 text-sm text-foreground">
                  gh auth login
                </code>
              </div>
              <button
                onClick={handleRefreshAccounts}
                disabled={refreshingAccounts}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {refreshingAccounts ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {accounts.map((account) => (
                  <div
                    key={`${account.host}/${account.username}`}
                    className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-border hover:bg-secondary/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                        {account.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {account.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {account.host} \u00B7 {account.protocol}
                        </p>
                      </div>
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                        Active
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAccount(account.username);
                          setActiveTab("repos");
                          handleLoadRepos(account.username);
                        }}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        View Repos
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleRefreshAccounts}
                disabled={refreshingAccounts}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {refreshingAccounts ? "Refreshing..." : "Refresh Accounts"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====== PLUGIN SEARCH TAB ====== */}
      {activeTab === "search" && (
        <div className="space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search GitHub for plugins..."
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => handleSearch()}
              disabled={searching}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Quick clone URL */}
          <div className="flex gap-2">
            <input
              type="text"
              value={quickCloneUrl}
              onChange={(e) => setQuickCloneUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickClone()}
              placeholder="Quick clone: owner/repo or full URL"
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleQuickClone}
              disabled={!quickCloneUrl.trim()}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              Clone
            </button>
          </div>

          {/* Results */}
          {searching ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Searching GitHub...
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {searchResults.map((repo) => (
                <GitHubRepoCard
                  key={repo.fullName}
                  repo={repo}
                  onClone={handleCloneFromCard}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              {searchQuery
                ? "No results found. Try a different search."
                : 'Search for Claude Code plugins on GitHub, or enter a URL above to clone directly.'}
            </div>
          )}
        </div>
      )}

      {/* ====== REPOS TAB ====== */}
      {activeTab === "repos" && (
        <div className="space-y-4">
          {/* Account selector + filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                handleLoadRepos(e.target.value);
              }}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {accounts.map((a) => (
                <option key={a.username} value={a.username}>
                  {a.username}
                </option>
              ))}
            </select>
            {languages.length > 0 && (
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All languages</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => handleLoadRepos()}
              disabled={loadingRepos}
              className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {loadingRepos ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* Repo grid */}
          {loadingRepos ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading repos...</p>
            </div>
          ) : filteredRepos.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredRepos.map((repo) => (
                <GitHubRepoCard
                  key={repo.fullName}
                  repo={repo}
                  onClone={handleCloneFromCard}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              {selectedAccount
                ? "No repos found for this account."
                : "Select an account to view repos."}
            </div>
          )}
        </div>
      )}

      {/* ====== LOCAL SYNC TAB ====== */}
      {activeTab === "local" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckAllSync}
              disabled={checkingAll}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {checkingAll ? "Checking all..." : "Check All Status"}
            </button>
            <span className="text-xs text-muted-foreground">
              {localRepos.filter((r) => r.syncStatus.state !== "unknown").length}{" "}
              / {localRepos.length} checked
            </span>
          </div>

          {localRepos.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {localRepos.map((repo) => (
                <LocalRepoCard key={repo.path} repo={repo} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              No local repos with GitHub remotes found in scan paths.
            </div>
          )}
        </div>
      )}

      {/* Clone Dialog */}
      {cloneDialogOpen && (
        <CloneDialog
          onClose={() => {
            setCloneDialogOpen(false);
            setClonePrefill(null);
          }}
          marketplaces={marketplaces}
          prefillRepo={clonePrefill}
        />
      )}
    </div>
  );
}

function GitHubSetupGuide() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            GitHub CLI Required
          </h3>
          <p className="text-xs text-muted-foreground">
            Install and authenticate the GitHub CLI to get started
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            1. Install GitHub CLI
          </p>
          <code className="block rounded bg-secondary px-3 py-2 text-sm text-foreground">
            brew install gh
          </code>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            2. Authenticate
          </p>
          <code className="block rounded bg-secondary px-3 py-2 text-sm text-foreground">
            gh auth login
          </code>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            3. Verify
          </p>
          <code className="block rounded bg-secondary px-3 py-2 text-sm text-foreground">
            gh auth status
          </code>
        </div>
      </div>
    </div>
  );
}
