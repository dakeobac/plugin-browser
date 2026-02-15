import { notFound } from "next/navigation";
import { loadAllPlugins } from "@/lib/marketplace-loader";
import { PluginFrontendViewer } from "@/components/PluginFrontendViewer";

export const dynamic = "force-dynamic";

export default async function PluginFrontendPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const { plugins } = loadAllPlugins();
  const plugin = plugins.find((p) => p.slug === decoded);

  if (!plugin) {
    notFound();
  }

  return <PluginFrontendViewer slug={decoded} name={plugin.name} />;
}
