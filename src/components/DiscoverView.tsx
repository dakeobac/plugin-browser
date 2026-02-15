"use client";

import { useState, useEffect } from "react";
import type {
  PatternAnalysis,
  PluginSuggestion,
  PluginFingerprint,
  ScanResult,
  AiAnalysisResult,
  AiPattern,
  AiSuggestion,
} from "@/lib/types";
import type { MarketplaceSource } from "../../marketplace.config";
import { DiscoveredPluginGrid } from "./DiscoveredPluginGrid";
import {
  StructuralPatternCard,
  CommandPatternCard,
  DomainGroupCard,
} from "./PatternCard";
import { SuggestionCard } from "./SuggestionCard";
import { CreatePluginDialog } from "./CreatePluginDialog";
import { AiPatternCard, AiSuggestionCard } from "./AiInsightCard";

type Tab = "scanner" | "patterns" | "suggestions";

const tabs: { id: Tab; label: string }[] = [
  { id: "scanner", label: "Scanner" },
  { id: "patterns", label: "Patterns" },
  { id: "suggestions", label: "Suggestions" },
];

export function DiscoverView({
  scanResult,
  analysis,
  suggestions,
  marketplaces,
  fingerprints,
}: {
  scanResult: ScanResult;
  analysis: PatternAnalysis;
  suggestions: PluginSuggestion[];
  marketplaces: MarketplaceSource[];
  fingerprints?: PluginFingerprint[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("scanner");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogMode, setCreateDialogMode] = useState<"form" | "brief">("form");
  const [prefillSuggestion, setPrefillSuggestion] =
    useState<PluginSuggestion | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult>({
    patterns: [],
    suggestions: [],
    status: "idle",
  });

  // Fire off AI analysis in background when fingerprints are available
  useEffect(() => {
    if (!fingerprints || fingerprints.length === 0) return;

    setAiAnalysis((prev) => ({ ...prev, status: "loading" }));

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch("/api/ai-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plugins: fingerprints }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setAiAnalysis((prev) => ({
            ...prev,
            status: "error",
            error: `API returned ${response.status}`,
          }));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json) continue;

            try {
              const event = JSON.parse(json);
              if (event.type === "result") {
                setAiAnalysis({
                  patterns: event.patterns || [],
                  suggestions: event.suggestions || [],
                  status: "done",
                });
              } else if (event.type === "error") {
                setAiAnalysis((prev) => ({
                  ...prev,
                  status: "error",
                  error: event.message,
                }));
              }
            } catch {
              // skip malformed json
            }
          }
        }

        // If we never got a result event, mark as done
        setAiAnalysis((prev) =>
          prev.status === "loading" ? { ...prev, status: "done" } : prev
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setAiAnalysis((prev) => ({
            ...prev,
            status: "error",
            error: (err as Error).message,
          }));
        }
      }
    })();

    return () => controller.abort();
  }, [fingerprints]);

  function handleCreateFromSuggestion(suggestion: PluginSuggestion) {
    setPrefillSuggestion(suggestion);
    setCreateDialogOpen(true);
  }

  function handleCreateBlank() {
    setPrefillSuggestion(null);
    setCreateDialogMode("form");
    setCreateDialogOpen(true);
  }

  function handleCreateFromBrief() {
    setPrefillSuggestion(null);
    setCreateDialogMode("brief");
    setCreateDialogOpen(true);
  }

  const registeredCount = scanResult.plugins.filter(
    (p) => p.registeredIn.length > 0
  ).length;
  const unregisteredCount = scanResult.plugins.length - registeredCount;

  const aiPatternCount = aiAnalysis.patterns.length;
  const aiSuggestionCount = aiAnalysis.suggestions.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Discover</h2>
          <p className="text-sm text-muted-foreground">
            {scanResult.plugins.length} plugins found across{" "}
            {scanResult.scanPaths.length} scan paths.{" "}
            <span className="text-green-400">{registeredCount} registered</span>
            {unregisteredCount > 0 && (
              <>
                {", "}
                <span className="text-amber-400">
                  {unregisteredCount} unregistered
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateBlank}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Plugin
          </button>
          <button
            onClick={handleCreateFromBrief}
            className="shrink-0 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
          >
            Create from Brief
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              {tab.id === "scanner"
                ? scanResult.plugins.length
                : tab.id === "patterns"
                  ? analysis.commandPatterns.length +
                    analysis.structuralPatterns.length +
                    analysis.domainGroups.length +
                    (aiPatternCount > 0 ? ` +${aiPatternCount}` : "")
                  : suggestions.length +
                    (aiSuggestionCount > 0 ? ` +${aiSuggestionCount}` : "")}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "scanner" && (
        <DiscoveredPluginGrid plugins={scanResult.plugins} />
      )}

      {activeTab === "patterns" && (
        <div className="space-y-6">
          {analysis.structuralPatterns.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Structural Patterns
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {analysis.structuralPatterns.map((p) => (
                  <StructuralPatternCard key={p.id} pattern={p} />
                ))}
              </div>
            </div>
          )}

          {analysis.commandPatterns.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Command Patterns
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {analysis.commandPatterns.map((p) => (
                  <CommandPatternCard key={p.pattern} pattern={p} />
                ))}
              </div>
            </div>
          )}

          {analysis.domainGroups.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Domain Groups
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {analysis.domainGroups.map((g) => (
                  <DomainGroupCard key={g.domain} group={g} />
                ))}
              </div>
            </div>
          )}

          {/* AI Insights section */}
          <AiInsightsSection
            status={aiAnalysis.status}
            error={aiAnalysis.error}
            patterns={aiAnalysis.patterns}
          />

          {analysis.structuralPatterns.length === 0 &&
            analysis.commandPatterns.length === 0 &&
            analysis.domainGroups.length === 0 &&
            aiAnalysis.patterns.length === 0 &&
            aiAnalysis.status !== "loading" && (
              <div className="py-16 text-center text-muted-foreground">
                No patterns detected. More plugins are needed for pattern
                analysis.
              </div>
            )}
        </div>
      )}

      {activeTab === "suggestions" && (
        <div className="space-y-6">
          {suggestions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Rule-Based Suggestions
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {suggestions.map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    onCreateClick={handleCreateFromSuggestion}
                  />
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions section */}
          <AiSuggestionsSection
            status={aiAnalysis.status}
            error={aiAnalysis.error}
            suggestions={aiAnalysis.suggestions}
          />

          {suggestions.length === 0 &&
            aiAnalysis.suggestions.length === 0 &&
            aiAnalysis.status !== "loading" && (
              <div className="py-16 text-center text-muted-foreground">
                No suggestions generated. More plugins and patterns are needed.
              </div>
            )}
        </div>
      )}

      {/* Create Plugin Dialog */}
      {createDialogOpen && (
        <CreatePluginDialog
          onClose={() => setCreateDialogOpen(false)}
          marketplaces={marketplaces}
          prefill={prefillSuggestion}
          initialMode={createDialogMode}
        />
      )}
    </div>
  );
}

function AiInsightsSection({
  status,
  error,
  patterns,
}: {
  status: AiAnalysisResult["status"];
  error?: string;
  patterns: AiPattern[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
        </svg>
        <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
        {status === "loading" && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Analyzing with OpenCode...
          </span>
        )}
      </div>

      {status === "loading" && patterns.length === 0 && (
        <div className="rounded-lg border border-border bg-card/50 p-8 text-center">
          <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            AI is analyzing plugin patterns...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          AI analysis unavailable: {error || "Unknown error"}
          <p className="mt-1 text-xs text-muted-foreground">
            Make sure OpenCode is running ({"`"}opencode serve{"`"})
          </p>
        </div>
      )}

      {patterns.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {patterns.map((p, i) => (
            <AiPatternCard key={`ai-pattern-${i}`} pattern={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function AiSuggestionsSection({
  status,
  error,
  suggestions,
}: {
  status: AiAnalysisResult["status"];
  error?: string;
  suggestions: AiSuggestion[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
        </svg>
        <h3 className="text-sm font-semibold text-foreground">AI Suggestions</h3>
        {status === "loading" && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Generating suggestions...
          </span>
        )}
      </div>

      {status === "loading" && suggestions.length === 0 && (
        <div className="rounded-lg border border-border bg-card/50 p-8 text-center">
          <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            AI is generating plugin suggestions...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          AI suggestions unavailable: {error || "Unknown error"}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {suggestions.map((s, i) => (
            <AiSuggestionCard key={`ai-suggestion-${i}`} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  );
}
