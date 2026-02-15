"use client";

export interface TabSource {
  id: string;
  name: string;
  count: number;
}

export function MarketplaceTabs({
  sources,
  active,
  onSelect,
  totalCount,
}: {
  sources: TabSource[];
  active: string | null;
  onSelect: (id: string | null) => void;
  totalCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          active === null
            ? "bg-primary/20 text-primary"
            : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        All
        <span className="ml-1.5 text-xs opacity-70">{totalCount}</span>
      </button>
      {sources.map((source) => (
        <button
          key={source.id}
          onClick={() => onSelect(source.id)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            active === source.id
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {source.name}
          <span className="ml-1.5 text-xs opacity-70">{source.count}</span>
        </button>
      ))}
    </div>
  );
}
