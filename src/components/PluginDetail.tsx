"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import type { PluginDetail as PluginDetailType } from "@/lib/types";
import { AntiFeatureBadgesFull } from "./AntiFeatureBadges";
import { UpdateBadge } from "./UpdateBadge";
import { UserRating } from "./UserRating";
import { PublishDialog } from "./PublishDialog";

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function AuthorName({ author }: { author: PluginDetailType["author"] }) {
  if (!author) return null;
  const name = typeof author === "string" ? author : author.name;
  return <span className="text-muted-foreground">by {name}</span>;
}

export function PluginDetailView({ plugin }: { plugin: PluginDetailType }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const router = useRouter();

  const cliName = plugin.installInfo?.cliName ?? null;
  const isInstalled = plugin.installInfo?.isInstalled ?? false;
  const isEnabled = plugin.installInfo?.isEnabled ?? false;

  async function runAction(action: string) {
    setLoading(action);
    try {
      const res = await fetch("/api/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, cliName }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Plugin action failed:", data.error);
      }
    } catch (err) {
      console.error("Plugin action error:", err);
    } finally {
      setLoading(null);
      router.refresh();
    }
  }

  async function openFolder(target: "finder" | "vscode") {
    setLoading(target);
    try {
      const res = await fetch("/api/plugins/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: plugin.pluginPath, target }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Open folder failed:", data.error);
      }
    } catch (err) {
      console.error("Open folder error:", err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{plugin.name}</h1>
          {plugin.version && (
            <span className="rounded bg-secondary px-2 py-0.5 text-sm text-muted-foreground">
              v{plugin.version}
            </span>
          )}
          <UpdateBadge updateInfo={plugin.updateInfo} />
          {plugin.category && (
            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              {plugin.category}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">{plugin.description}</p>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <AuthorName author={plugin.author} />
          <span>from {plugin.marketplace}</span>
          {plugin.homepage && (
            <a
              href={plugin.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Homepage
            </a>
          )}
        </div>
      </div>

      {/* User Rating */}
      <UserRating slug={plugin.slug} initialData={plugin.userData} />

      {/* Feature badges */}
      <div className="flex flex-wrap gap-2">
        {plugin.hasCommands && (
          <Badge className="bg-secondary text-foreground">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {plugin.commandCount} commands
          </Badge>
        )}
        {plugin.hasSkills && (
          <Badge className="bg-secondary text-foreground">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {plugin.skillCount} skills
          </Badge>
        )}
        {plugin.hasAgents && (
          <Badge className="bg-secondary text-foreground">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {plugin.agentCount} agents
          </Badge>
        )}
        {plugin.hasMcp && (
          <Badge className="bg-secondary text-foreground">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            MCP server
          </Badge>
        )}
        {plugin.hasHooks && (
          <Badge className="bg-secondary text-foreground">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Hooks
          </Badge>
        )}
        {plugin.isSymlink && (
          <Badge className="bg-amber-500/20 text-amber-400">
            Symlink
          </Badge>
        )}
      </div>

      {/* Anti-feature badges */}
      <AntiFeatureBadgesFull antiFeatures={plugin.antiFeatures} />

      {/* Install / Manage */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          {isInstalled ? "Manage" : "Install"}
        </h2>
        {cliName ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              {!isInstalled && (
                <button
                  disabled={loading !== null}
                  onClick={() => runAction("install")}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  {loading === "install" ? "Installing..." : "Install"}
                </button>
              )}
              {isInstalled && plugin.updateInfo?.hasUpdate && (
                <button
                  disabled={loading !== null}
                  onClick={() => runAction("install")}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  {loading === "install" ? "Updating..." : "Update"}
                </button>
              )}
              {isInstalled && isEnabled && (
                <button
                  disabled={loading !== null}
                  onClick={() => runAction("disable")}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-secondary hover:bg-accent text-foreground disabled:opacity-50"
                >
                  {loading === "disable" ? "Disabling..." : "Disable"}
                </button>
              )}
              {isInstalled && !isEnabled && (
                <button
                  disabled={loading !== null}
                  onClick={() => runAction("enable")}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-secondary hover:bg-accent text-foreground disabled:opacity-50"
                >
                  {loading === "enable" ? "Enabling..." : "Enable"}
                </button>
              )}
              {isInstalled && (
                <button
                  disabled={loading !== null}
                  onClick={() => runAction("uninstall")}
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 disabled:opacity-50"
                >
                  {loading === "uninstall" ? "Removing..." : "Uninstall"}
                </button>
              )}
            </div>
            {plugin.updateInfo?.hasUpdate && (
              <p className="mb-2 text-xs text-blue-400">
                Installed: v{plugin.updateInfo.installedVersion} → Available: v{plugin.updateInfo.availableVersion}
              </p>
            )}
            <pre className="rounded-lg bg-card border border-border p-3 text-sm text-foreground overflow-x-auto">
              <code>claude plugin install {cliName}</code>
            </pre>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This plugin&apos;s marketplace is not registered with the CLI. Add it with{" "}
            <code className="text-muted-foreground">claude plugin marketplace add</code> to enable install/manage.
          </p>
        )}
      </div>

      {/* Open in Agent / Launch Agent / Finder / VS Code */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/agent?plugin=${encodeURIComponent(plugin.name)}&cwd=${encodeURIComponent(plugin.pluginPath)}`}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-500/20 border border-purple-500/30 px-4 py-2 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Open in Chat
        </Link>
        {plugin.hasAgents && (
          <Link
            href={`/agents?launch=${encodeURIComponent(plugin.slug)}`}
            className="inline-flex items-center gap-2 rounded-lg bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
            </svg>
            Launch Agent
          </Link>
        )}
        <button
          disabled={loading !== null}
          onClick={() => openFolder("finder")}
          className="inline-flex items-center gap-2 rounded-lg bg-secondary border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          {loading === "finder" ? "Opening..." : "Open in Finder"}
        </button>
        <button
          disabled={loading !== null}
          onClick={() => openFolder("vscode")}
          className="inline-flex items-center gap-2 rounded-lg bg-secondary border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          {loading === "vscode" ? "Opening..." : "Open in VS Code"}
        </button>
        <button
          onClick={() => setShowPublish(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-500/20 border border-purple-500/30 px-4 py-2 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          Publish to Ecosystem
        </button>
      </div>

      {showPublish && (
        <PublishDialog plugin={plugin} onClose={() => setShowPublish(false)} />
      )}

      {/* Commands & Skills lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {plugin.commands.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              Commands
            </h2>
            <ul className="space-y-1">
              {plugin.commands.map((cmd) => (
                <li key={cmd} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-muted-foreground">/</span>
                  <span className="font-mono">{cmd.replace(".md", "")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {plugin.skills.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              Skills
            </h2>
            <ul className="space-y-1">
              {plugin.skills.map((skill) => (
                <li key={skill} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-muted-foreground">*</span>
                  <span className="font-mono">{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {plugin.agents.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              Agents
            </h2>
            <ul className="space-y-1">
              {plugin.agents.map((agent) => (
                <li key={agent} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-muted-foreground">&gt;</span>
                  <span className="font-mono">{agent.replace(".md", "")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* README */}
      {plugin.readme && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">README</h2>
          <div className="prose-theme rounded-lg border border-border bg-card p-6">
            <Markdown>{plugin.readme}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
