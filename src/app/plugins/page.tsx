import Link from "next/link";
import { loadAllPlugins } from "@/lib/marketplace-loader";
import { loadFeaturedPlugins } from "@/lib/featured";
import { PluginGrid } from "@/components/PluginGrid";
import { FeaturedSection } from "@/components/FeaturedSection";

export const dynamic = "force-dynamic";

export default function PluginsPage() {
  const { plugins, sources } = loadAllPlugins();
  const featured = loadFeaturedPlugins();

  const categoryCounts: Record<string, number> = {};
  for (const p of plugins) {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  }

  return (
    <>
      <Link
        href="/discover"
        className="mb-6 flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 transition-colors hover:bg-blue-500/15"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
          <svg
            className="h-5 w-5 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div>
          <span className="font-semibold text-blue-400">Plugin Factory</span>
          <p className="text-sm text-muted-foreground">
            Discover patterns across your plugins, get suggestions for new ones, and scaffold them in seconds.
          </p>
        </div>
        <svg
          className="ml-auto h-5 w-5 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
      <FeaturedSection featured={featured} plugins={plugins} />
      <PluginGrid
        plugins={plugins}
        sources={sources.map((s) => ({ id: s.id, name: s.name, count: s.count }))}
        categoryCounts={categoryCounts}
      />
    </>
  );
}
