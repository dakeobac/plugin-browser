"use client";

import { useState, useMemo } from "react";
import type { PluginSummary } from "@/lib/types";
import { MarketplaceTabs, type TabSource } from "./MarketplaceTabs";
import { SearchBar } from "./SearchBar";
import { PluginCard } from "./PluginCard";

export function PluginGrid({
  plugins,
  sources,
}: {
  plugins: PluginSummary[];
  sources: TabSource[];
}) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = plugins;

    if (activeTab) {
      result = result.filter((p) => p.marketplace === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.keywords && p.keywords.some((k) => k.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [plugins, activeTab, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <MarketplaceTabs
          sources={sources}
          active={activeTab}
          onSelect={setActiveTab}
          totalCount={plugins.length}
        />
        <div className="w-full sm:w-64">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">
          No plugins found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plugin) => (
            <PluginCard key={plugin.slug} plugin={plugin} />
          ))}
        </div>
      )}
    </div>
  );
}
