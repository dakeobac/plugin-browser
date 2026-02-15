import { notFound } from "next/navigation";
import Link from "next/link";
import { loadAllPlugins } from "@/lib/marketplace-loader";
import { loadPluginDetail } from "@/lib/plugin-parser";
import { PluginDetailView } from "@/components/PluginDetail";

export const dynamic = "force-dynamic";

export default async function PluginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { plugins } = loadAllPlugins();
  const summary = plugins.find((p) => p.slug === slug);

  if (!summary) notFound();

  const detail = loadPluginDetail(summary);

  return (
    <div>
      <Link
        href="/plugins"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent-foreground transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to plugins
      </Link>
      <PluginDetailView plugin={detail} />
    </div>
  );
}
