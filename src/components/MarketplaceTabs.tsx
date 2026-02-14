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
            ? "bg-blue-500/20 text-blue-400"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
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
              ? "bg-blue-500/20 text-blue-400"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
          }`}
        >
          {source.name}
          <span className="ml-1.5 text-xs opacity-70">{source.count}</span>
        </button>
      ))}
    </div>
  );
}
