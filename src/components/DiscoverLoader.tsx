"use client";

import { useState, useEffect } from "react";
import type {
  PatternAnalysis,
  PluginSuggestion,
  PluginFingerprint,
  ScanResult,
} from "@/lib/types";
import type { MarketplaceSource } from "../../marketplace.config";
import { DiscoverView } from "./DiscoverView";

const emptyScan: ScanResult = { plugins: [], totalScanned: 0, scanPaths: [] };
const emptyAnalysis: PatternAnalysis = {
  commandPatterns: [],
  structuralPatterns: [],
  domainGroups: [],
};

export function DiscoverLoader({
  marketplaces,
}: {
  marketplaces: MarketplaceSource[];
}) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<PluginSuggestion[] | null>(null);
  const [fingerprints, setFingerprints] = useState<PluginFingerprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/scanner").then((r) => (r.ok ? r.json() : emptyScan)),
      fetch("/api/patterns").then((r) =>
        r.ok
          ? r.json()
          : { analysis: emptyAnalysis, suggestions: [] }
      ),
    ]).then(([scan, patterns]) => {
      if (cancelled) return;
      setScanResult(scan as ScanResult);
      setAnalysis(patterns.analysis as PatternAnalysis);
      setSuggestions(patterns.suggestions as PluginSuggestion[]);
      setFingerprints((patterns.analysis?.fingerprints as PluginFingerprint[]) || []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Discover</h2>
          <p className="text-sm text-muted-foreground">Scanning plugins...</p>
        </div>
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <DiscoverView
      scanResult={scanResult || emptyScan}
      analysis={analysis || emptyAnalysis}
      suggestions={suggestions || []}
      marketplaces={marketplaces}
      fingerprints={fingerprints}
    />
  );
}
