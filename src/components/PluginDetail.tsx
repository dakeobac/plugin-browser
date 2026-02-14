"use client";

import Markdown from "react-markdown";
import type { PluginDetail as PluginDetailType } from "@/lib/types";

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
  return <span className="text-zinc-400">by {name}</span>;
}

export function PluginDetailView({ plugin }: { plugin: PluginDetailType }) {
  const installPath = plugin.isSymlink && plugin.symlinkTarget
    ? plugin.symlinkTarget
    : plugin.pluginPath;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">{plugin.name}</h1>
          {plugin.version && (
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-sm text-zinc-400">
              v{plugin.version}
            </span>
          )}
          {plugin.category && (
            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              {plugin.category}
            </span>
          )}
        </div>
        <p className="text-zinc-400">{plugin.description}</p>
        <div className="mt-2 flex items-center gap-4 text-sm text-zinc-500">
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

      {/* Feature badges */}
      <div className="flex flex-wrap gap-2">
        {plugin.hasCommands && (
          <Badge className="bg-zinc-800 text-zinc-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {plugin.commandCount} commands
          </Badge>
        )}
        {plugin.hasSkills && (
          <Badge className="bg-zinc-800 text-zinc-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {plugin.skillCount} skills
          </Badge>
        )}
        {plugin.hasAgents && (
          <Badge className="bg-zinc-800 text-zinc-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {plugin.agentCount} agents
          </Badge>
        )}
        {plugin.hasMcp && (
          <Badge className="bg-zinc-800 text-zinc-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            MCP server
          </Badge>
        )}
        {plugin.hasHooks && (
          <Badge className="bg-zinc-800 text-zinc-300">
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

      {/* Install command */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-300">Install</h2>
        <pre className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-sm text-zinc-300 overflow-x-auto">
          <code>claude --plugin-dir {installPath}</code>
        </pre>
      </div>

      {/* Commands & Skills lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {plugin.commands.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-300">
              Commands
            </h2>
            <ul className="space-y-1">
              {plugin.commands.map((cmd) => (
                <li key={cmd} className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="text-zinc-600">/</span>
                  <span className="font-mono">{cmd.replace(".md", "")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {plugin.skills.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-300">
              Skills
            </h2>
            <ul className="space-y-1">
              {plugin.skills.map((skill) => (
                <li key={skill} className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="text-zinc-600">*</span>
                  <span className="font-mono">{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {plugin.agents.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-300">
              Agents
            </h2>
            <ul className="space-y-1">
              {plugin.agents.map((agent) => (
                <li key={agent} className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="text-zinc-600">&gt;</span>
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
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">README</h2>
          <div className="prose-dark rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <Markdown>{plugin.readme}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
