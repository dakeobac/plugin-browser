"use client";

import { useState, useMemo } from "react";
import type { PluginSummary } from "@/lib/types";
import { MarketplaceTabs, type TabSource } from "./MarketplaceTabs";
import { SearchBar } from "./SearchBar";
import { PluginCard } from "./PluginCard";
import { CategoryFilter } from "./CategoryFilter";

export function PluginGrid({
  plugins,
  sources,
  categoryCounts,
}: {
  plugins: PluginSummary[];
  sources: TabSource[];
  categoryCounts: Record<string, number>;
}) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    return Object.keys(categoryCounts).sort();
  }, [categoryCounts]);

  const filtered = useMemo(() => {
    let result = plugins;

    if (activeTab) {
      result = result.filter((p) => p.marketplace === activeTab);
    }

    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
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
  }, [plugins, activeTab, activeCategory, search]);

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

      <CategoryFilter
        categories={categories}
        selected={activeCategory}
        onSelect={setActiveCategory}
        counts={categoryCounts}
      />

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
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
