"use client";

import Link from "next/link";
import type { PluginSummary } from "@/lib/types";
import { categoryColors } from "@/lib/category-colors";
import { AntiFeatureBadgesCompact } from "./AntiFeatureBadges";
import { UpdateBadge } from "./UpdateBadge";
import { UserRatingCompact } from "./UserRating";

function FeatureIcon({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <span title={title} className="text-muted-foreground">
      {children}
    </span>
  );
}

export function PluginCard({ plugin }: { plugin: PluginSummary }) {
  const catClass =
    categoryColors[plugin.category || ""] || "bg-accent/50 text-muted-foreground";

  return (
    <Link
      href={`/plugin/${plugin.slug}`}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-border hover:bg-secondary/80"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground group-hover:text-blue-400 transition-colors">
          {plugin.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <UpdateBadge updateInfo={plugin.updateInfo} />
          {plugin.version && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground group-hover:bg-accent">
              v{plugin.version}
            </span>
          )}
          {plugin.platform === "opencode" ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
              OpenCode
            </span>
          ) : (
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-400">
              Claude Code
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

      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
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
        <AntiFeatureBadgesCompact antiFeatures={plugin.antiFeatures} />
        <UserRatingCompact rating={plugin.userData?.rating} />
        {plugin.installInfo?.isInstalled && (
          <span
            className={`ml-auto h-2 w-2 rounded-full ${
              plugin.installInfo.isEnabled ? "bg-green-500" : "bg-amber-500"
            }`}
            title={plugin.installInfo.isEnabled ? "Installed & enabled" : "Installed but disabled"}
          />
        )}
        {plugin.isSymlink && (
          <span className={`${plugin.installInfo?.isInstalled ? "" : "ml-auto "}text-muted-foreground`} title={`Symlink → ${plugin.symlinkTarget}`}>
            ~
          </span>
        )}
      </div>
    </Link>
  );
}
