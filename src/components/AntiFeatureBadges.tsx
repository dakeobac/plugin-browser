"use client";

import type { AntiFeatures } from "@/lib/types";
import { ANTI_FEATURE_META } from "@/lib/types";

const severityStyles = {
  info: "bg-accent/50 text-muted-foreground",
  warn: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  danger: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const icons: Record<keyof AntiFeatures, React.ReactNode> = {
  usesNetwork: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  executesShell: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  requiresApiKeys: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  hasNonFreeDeps: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
};

function hasAnyAntiFeature(af: AntiFeatures): boolean {
  return af.usesNetwork || af.executesShell || af.requiresApiKeys || af.hasNonFreeDeps;
}

export function AntiFeatureBadgesCompact({ antiFeatures }: { antiFeatures?: AntiFeatures }) {
  if (!antiFeatures || !hasAnyAntiFeature(antiFeatures)) return null;

  const active = (Object.keys(ANTI_FEATURE_META) as (keyof AntiFeatures)[]).filter(
    (key) => antiFeatures[key]
  );

  return (
    <span className="inline-flex items-center gap-1">
      {active.map((key) => {
        const meta = ANTI_FEATURE_META[key];
        return (
          <span
            key={key}
            title={`${meta.label}: ${meta.description}`}
            className={`inline-flex items-center rounded p-0.5 ${severityStyles[meta.severity]}`}
          >
            {icons[key]}
          </span>
        );
      })}
    </span>
  );
}

export function AntiFeatureBadgesFull({ antiFeatures }: { antiFeatures?: AntiFeatures }) {
  if (!antiFeatures || !hasAnyAntiFeature(antiFeatures)) return null;

  const active = (Object.keys(ANTI_FEATURE_META) as (keyof AntiFeatures)[]).filter(
    (key) => antiFeatures[key]
  );

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-foreground">Transparency</h2>
      <div className="space-y-2">
        {active.map((key) => {
          const meta = ANTI_FEATURE_META[key];
          return (
            <div
              key={key}
              className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm ${severityStyles[meta.severity]}`}
            >
              <span className="mt-0.5 shrink-0">{icons[key]}</span>
              <div>
                <span className="font-medium">{meta.label}</span>
                <p className="mt-0.5 text-xs opacity-80">{meta.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
