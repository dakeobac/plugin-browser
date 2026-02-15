"use client";

import { categoryColors } from "@/lib/category-colors";

export function CategoryFilter({
  categories,
  selected,
  onSelect,
  counts,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
  counts: Record<string, number>;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          selected === null
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        All
      </button>
      {categories.map((cat) => {
        const isActive = selected === cat;
        const colorClass = categoryColors[cat] || "bg-accent/50 text-muted-foreground";
        return (
          <button
            key={cat}
            onClick={() => onSelect(isActive ? null : cat)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? colorClass
                : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {cat}
            {counts[cat] != null && (
              <span className="ml-1 opacity-60">{counts[cat]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
