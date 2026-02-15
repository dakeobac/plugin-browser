"use client";

import { useState, useEffect, useCallback } from "react";
import type { RegistryEntry } from "@/lib/types";
import { RegistrySearch } from "./RegistrySearch";
import { EcosystemCard } from "./EcosystemCard";

export function EcosystemBrowser() {
  const [results, setResults] = useState<RegistryEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installResult, setInstallResult] = useState<{ name: string; success: boolean; error?: string } | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (platform) params.set("platform", platform);
      if (category) params.set("category", category);

      const res = await fetch(`/api/ecosystem/search?${params}`);
      const data = await res.json();
      setResults(data.results || []);
      setCategories(data.categories || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [query, platform, category]);

  useEffect(() => {
    const timer = setTimeout(fetchResults, 300); // debounce
    return () => clearTimeout(timer);
  }, [fetchResults]);

  async function handleInstall(entry: RegistryEntry) {
    setInstalling(entry.name);
    setInstallResult(null);

    try {
      const res = await fetch("/api/ecosystem/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: entry.repository,
          targetMarketplace: "local",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInstallResult({ name: entry.name, success: true });
      } else {
        setInstallResult({ name: entry.name, success: false, error: data.error });
      }
    } catch (err) {
      setInstallResult({ name: entry.name, success: false, error: (err as Error).message });
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="space-y-6">
      <RegistrySearch
        query={query}
        onQueryChange={setQuery}
        platform={platform}
        onPlatformChange={setPlatform}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
      />

      {installResult && (
        <div className={`rounded-lg border p-3 ${
          installResult.success
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        }`}>
          {installResult.success
            ? `Successfully installed ${installResult.name}!`
            : `Failed to install ${installResult.name}: ${installResult.error}`
          }
          <button
            onClick={() => setInstallResult(null)}
            className="ml-2 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading ecosystem...
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-foreground font-medium">No plugins found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {query ? "Try a different search term" : "The ecosystem registry is empty or unreachable"}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((entry) => (
              <EcosystemCard
                key={entry.name}
                entry={entry}
                onInstall={handleInstall}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
