import { loadAllPlugins } from "@/lib/marketplace-loader";
import { scanForPlugins } from "@/lib/plugin-scanner";
import { analyzePatterns, buildFingerprints } from "@/lib/pattern-analyzer";
import { generateSuggestions } from "@/lib/plugin-suggestions";
import { marketplaces } from "../../../marketplace.config";
import { DiscoverView } from "@/components/DiscoverView";

export const dynamic = "force-dynamic";

export default function DiscoverPage() {
  const { plugins } = loadAllPlugins();
  const scanResult = scanForPlugins();
  const analysis = analyzePatterns(plugins);
  const suggestions = generateSuggestions(analysis, plugins);
  const fingerprints = buildFingerprints(plugins);

  return (
    <DiscoverView
      scanResult={scanResult}
      analysis={analysis}
      suggestions={suggestions}
      marketplaces={marketplaces}
      fingerprints={fingerprints}
    />
  );
}
