"use client";

import Link from "next/link";
import type { PluginSummary } from "@/lib/types";

const categoryColors: Record<string, string> = {
  development: "bg-blue-500/20 text-blue-400",
  productivity: "bg-green-500/20 text-green-400",
  entertainment: "bg-purple-500/20 text-purple-400",
  security: "bg-red-500/20 text-red-400",
  testing: "bg-amber-500/20 text-amber-400",
  database: "bg-cyan-500/20 text-cyan-400",
  design: "bg-pink-500/20 text-pink-400",
  monitoring: "bg-orange-500/20 text-orange-400",
  deployment: "bg-teal-500/20 text-teal-400",
  learning: "bg-indigo-500/20 text-indigo-400",
};

function FeatureIcon({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <span title={title} className="text-zinc-500">
      {children}
    </span>
  );
}

export function PluginCard({ plugin }: { plugin: PluginSummary }) {
  const catClass =
    categoryColors[plugin.category || ""] || "bg-zinc-700/50 text-zinc-400";

  return (
    <Link
      href={`/plugin/${plugin.slug}`}
      className="group flex flex-col rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/80"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
          {plugin.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {plugin.version && (
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500 group-hover:bg-zinc-700">
              v{plugin.version}
            </span>
          )}
          {plugin.category && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${catClass}`}
            >
              {plugin.category}
            </span>
          )}
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
        {plugin.description}
      </p>

      <div className="mt-auto flex items-center gap-3 text-xs">
        {plugin.hasCommands && (
          <FeatureIcon title={`${plugin.commandCount} commands`}>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {plugin.commandCount}
            </span>
          </FeatureIcon>
        )}
        {plugin.hasSkills && (
          <FeatureIcon title={`${plugin.skillCount} skills`}>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {plugin.skillCount}
            </span>
          </FeatureIcon>
        )}
        {plugin.hasAgents && (
          <FeatureIcon title={`${plugin.agentCount} agents`}>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {plugin.agentCount}
            </span>
          </FeatureIcon>
        )}
        {plugin.hasMcp && (
          <FeatureIcon title="MCP server">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              MCP
            </span>
          </FeatureIcon>
        )}
        {plugin.hasHooks && (
          <FeatureIcon title="Hooks">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Hooks
            </span>
          </FeatureIcon>
        )}
        {plugin.isSymlink && (
          <span className="ml-auto text-zinc-600" title={`Symlink → ${plugin.symlinkTarget}`}>
            ~
          </span>
        )}
      </div>
    </Link>
  );
}
