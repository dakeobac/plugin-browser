"use client";

import Link from "next/link";
import type { FeaturedPlugin, PluginSummary } from "@/lib/types";
import { categoryColors } from "@/lib/category-colors";

export function FeaturedSection({
  featured,
  plugins,
}: {
  featured: FeaturedPlugin[];
  plugins: PluginSummary[];
}) {
  if (featured.length === 0) return null;

  const matched = featured
    .map((f) => {
      const plugin = plugins.find((p) => p.slug === f.slug);
      return plugin ? { ...f, plugin } : null;
    })
    .filter(Boolean) as { slug: string; tagline?: string; plugin: PluginSummary }[];

  if (matched.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Featured
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matched.map(({ slug, tagline, plugin }) => {
          const catClass =
            categoryColors[plugin.category || ""] || "border-blue-500/30";
          const borderColor = catClass.includes("text-")
            ? catClass.split(" ").find((c) => c.startsWith("text-"))?.replace("text-", "border-") || "border-blue-500/30"
            : "border-blue-500/30";

          return (
            <Link
              key={slug}
              href={`/plugin/${slug}`}
              className={`group relative flex flex-col rounded-lg border ${borderColor} bg-gradient-to-br from-card to-card/80 p-5 transition-all hover:from-secondary/80 hover:to-card`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
              <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                {plugin.name}
              </h3>
              {tagline && (
                <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
              )}
              {!tagline && plugin.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {plugin.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                {plugin.category && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      categoryColors[plugin.category] || "bg-accent/50 text-muted-foreground"
                    }`}
                  >
                    {plugin.category}
                  </span>
                )}
                {plugin.version && <span>v{plugin.version}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
