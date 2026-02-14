import { loadAllPlugins } from "@/lib/marketplace-loader";
import { PluginGrid } from "@/components/PluginGrid";

export const dynamic = "force-dynamic";

export default function Home() {
  const { plugins, sources } = loadAllPlugins();

  return (
    <PluginGrid
      plugins={plugins}
      sources={sources.map((s) => ({ id: s.id, name: s.name, count: s.count }))}
    />
  );
}
