"use client";

import Link from "next/link";
import type {
  CommandPattern,
  StructuralPattern,
  DomainGroup,
} from "@/lib/types";

function PluginLink({ slug, name }: { slug?: string; name: string }) {
  if (slug) {
    return (
      <Link
        href={`/plugin/${slug}`}
        className="text-blue-400 hover:underline"
      >
        {name}
      </Link>
    );
  }
  return <span className="text-foreground">{name}</span>;
}

const patternIcons: Record<string, string> = {
  "audit-checklist": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  "scaffold-commands":
    "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
  "mcp-wrapper":
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  "hooks-session": "M13 10V3L4 14h7v7l9-11h-7z",
  "markdown-state":
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
};

export function StructuralPatternCard({
  pattern,
}: {
  pattern: StructuralPattern;
}) {
  const iconPath = patternIcons[pattern.id] || patternIcons["audit-checklist"];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20">
          <svg
            className="h-4 w-4 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={iconPath}
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{pattern.name}</h3>
          <p className="text-sm text-muted-foreground">{pattern.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-muted-foreground">
          {pattern.plugins.length} plugins:
        </span>
        {pattern.plugins.map((name, i) => (
          <span key={name}>
            <PluginLink slug={pattern.pluginSlugs[i]} name={name} />
            {i < pattern.plugins.length - 1 && (
              <span className="text-muted-foreground">,</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CommandPatternCard({
  pattern,
}: {
  pattern: CommandPattern;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
          <svg
            className="h-4 w-4 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            {pattern.pattern} pattern
          </h3>
          <p className="text-sm text-muted-foreground">{pattern.description}</p>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {pattern.matchedCommands.map((cmd) => (
          <span
            key={cmd}
            className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
          >
            /{cmd}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-muted-foreground">
          in {pattern.plugins.length} plugins:
        </span>
        {pattern.plugins.map((name, i) => (
          <span key={name} className="text-xs text-foreground">
            {name}
            {i < pattern.plugins.length - 1 && (
              <span className="text-muted-foreground">,</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DomainGroupCard({ group }: { group: DomainGroup }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/20">
          <svg
            className="h-4 w-4 text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            Domain: {group.domain}
          </h3>
          <p className="text-sm text-muted-foreground">
            {group.plugins.length} plugins in the {group.domain} ecosystem
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {group.plugins.map((name, i) => (
          <span key={name}>
            <PluginLink slug={group.pluginSlugs[i]} name={name} />
            {i < group.plugins.length - 1 && (
              <span className="text-muted-foreground">,</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
