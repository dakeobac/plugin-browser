import { Suspense } from "react";
import { loadAllPlugins } from "@/lib/marketplace-loader";
import { scanForPlugins } from "@/lib/plugin-scanner";
import { analyzePatterns } from "@/lib/pattern-analyzer";
import { generateSuggestions } from "@/lib/plugin-suggestions";
import { detectPluginFrontends } from "@/lib/plugin-frontend";
import { buildPluginContextSummary } from "@/lib/plugin-context";
import { HomeOrchestrator } from "@/components/HomeOrchestrator";
import { LandingView } from "@/components/LandingView";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  const { plugins } = loadAllPlugins();
  const installed = plugins.filter((p) => p.installInfo?.isInstalled);

  if (installed.length > 0) {
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

  // New user: compute stats for landing page
  const scanResult = scanForPlugins();
  const analysis = analyzePatterns(plugins);
  const suggestions = generateSuggestions(analysis, plugins);

  const stats = {
    pluginsDiscovered: scanResult.plugins.length,
    patternsFound:
      analysis.commandPatterns.length +
      analysis.structuralPatterns.length +
      analysis.domainGroups.length,
    suggestionsReady: suggestions.length,
  };

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-73px)] items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LandingView stats={stats} />
    </Suspense>
  );
}
