"use client";

import type { DiscoveredPlugin } from "@/lib/types";

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

function RegistrationBadge({ registeredIn }: { registeredIn: string[] }) {
  if (registeredIn.length === 0) {
    return (
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
        Not Registered
      </span>
    );
  }
  return (
    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
      {registeredIn.join(", ")}
    </span>
  );
}

export function DiscoveredPluginGrid({
  plugins,
}: {
  plugins: DiscoveredPlugin[];
}) {
  if (plugins.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        No plugins discovered. Check that scan paths are configured correctly.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plugins.map((plugin) => (
        <div
          key={plugin.realPath}
          className="flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-border hover:bg-secondary/80"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">{plugin.name}</h3>
            <RegistrationBadge registeredIn={plugin.registeredIn} />
          </div>

          <p className="mb-1 truncate text-xs font-mono text-muted-foreground">
            {plugin.path.replace(/^\/Users\/[^/]+/, "~")}
          </p>

          {plugin.description && (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {plugin.description}
            </p>
          )}

          <div className="mt-auto flex items-center gap-3 text-xs">
            {plugin.hasCommands && (
              <FeatureIcon title={`${plugin.commandCount} commands`}>
                <span className="flex items-center gap-1">
                  <svg
                    className="h-3.5 w-3.5"
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
                  {plugin.commandCount}
                </span>
              </FeatureIcon>
            )}
            {plugin.hasSkills && (
              <FeatureIcon title={`${plugin.skillCount} skills`}>
                <span className="flex items-center gap-1">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  {plugin.skillCount}
                </span>
              </FeatureIcon>
            )}
            {plugin.hasAgents && (
              <FeatureIcon title={`${plugin.agentCount} agents`}>
                <span className="flex items-center gap-1">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {plugin.agentCount}
                </span>
              </FeatureIcon>
            )}
            {plugin.hasMcp && (
              <FeatureIcon title="MCP server">
                <span className="flex items-center gap-1">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  MCP
                </span>
              </FeatureIcon>
            )}
            {plugin.hasHooks && (
              <FeatureIcon title="Hooks">
                <span className="flex items-center gap-1">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Hooks
                </span>
              </FeatureIcon>
            )}
            {!plugin.hasPluginJson && (
              <span
                className="ml-auto text-muted-foreground"
                title="Missing plugin.json"
              >
                No manifest
              </span>
            )}
            {plugin.version && (
              <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                v{plugin.version}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
