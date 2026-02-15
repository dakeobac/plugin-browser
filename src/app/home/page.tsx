import { loadAllPlugins } from "@/lib/marketplace-loader";
import { detectPluginFrontends } from "@/lib/plugin-frontend";
import { buildPluginContextSummary } from "@/lib/plugin-context";
import { HomeOrchestrator } from "@/components/HomeOrchestrator";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { plugins } = loadAllPlugins();
  const frontends = detectPluginFrontends(plugins);
  const pluginContext = buildPluginContextSummary(plugins, frontends);

  return (
    <HomeOrchestrator
      plugins={plugins}
      frontends={frontends}
      pluginContext={pluginContext}
    />
  );
}
