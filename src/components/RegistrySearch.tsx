"use client";

interface RegistrySearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  platform: string;
  onPlatformChange: (platform: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function RegistrySearch({
  query,
  onQueryChange,
  platform,
  onPlatformChange,
  category,
  onCategoryChange,
  categories,
}: RegistrySearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="text"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          placeholder="Search plugins, agents, workflows..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <select
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
        value={platform}
        onChange={(e) => onPlatformChange(e.target.value)}
      >
        <option value="">All Platforms</option>
        <option value="claude-code">Claude Code</option>
        <option value="opencode">OpenCode</option>
        <option value="both">Cross-Platform</option>
      </select>

      <select
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
