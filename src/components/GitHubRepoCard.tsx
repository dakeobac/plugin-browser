"use client";

import type { GitHubRepo } from "@/lib/types";

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-500",
  Python: "bg-green-500",
  Rust: "bg-orange-500",
  Go: "bg-cyan-500",
  Shell: "bg-zinc-400",
  Markdown: "bg-zinc-500",
};

export function GitHubRepoCard({
  repo,
  onClone,
}: {
  repo: GitHubRepo;
  onClone: (repo: GitHubRepo) => void;
}) {
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
            {repo.isPrivate && (
              <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                Private
              </span>
            )}
            {repo.isFork && (
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Fork
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{repo.fullName}</p>
        </div>
        {repo.stars > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
            </svg>
            {repo.stars}
          </span>
        )}
      </div>

      {repo.description && (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {repo.description}
        </p>
      )}

      {/* Language + topics */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {repo.language && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className={`h-2 w-2 rounded-full ${languageColors[repo.language] || "bg-zinc-500"}`}
            />
            {repo.language}
          </span>
        )}
        {repo.topics.slice(0, 4).map((t) => (
          <span
            key={t}
            className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
          >
            {t}
          </span>
        ))}
        {repo.topics.length > 4 && (
          <span className="text-xs text-muted-foreground">
            +{repo.topics.length - 4}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onClone(repo)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Clone as Plugin
        </button>
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}
