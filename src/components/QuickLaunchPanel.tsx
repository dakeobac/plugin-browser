"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Team, Workflow } from "@/lib/types";

interface QuickLaunchPanelProps {
  teams: Team[];
  workflows: Workflow[];
}

const GETTING_STARTED = [
  {
    label: "Browse Plugins",
    desc: "Explore the plugin marketplace",
    href: "/plugins",
    icon: "M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V15m0 0l-2.25-1.313M3 16.5v2.25M21 16.5v2.25M12 3v2.25m6.75.75l-2.25 1.313M5.25 6l2.25 1.313",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    label: "Launch Agent",
    desc: "Run an agent with any prompt",
    href: "/agents",
    icon: "M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Create Team",
    desc: "Assemble agents into a team",
    href: "/teams",
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    label: "Build Workflow",
    desc: "Automate multi-step agent tasks",
    href: "/workflows",
    icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

export function QuickLaunchPanel({ teams, workflows }: QuickLaunchPanelProps) {
  const router = useRouter();
  const hasContent = teams.length > 0 || workflows.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Launch a Team</h3>
        <Link
          href="/teams"
          className="text-xs text-blue-400 transition-colors hover:text-blue-300"
        >
          Browse all &rarr;
        </Link>
      </div>

      {!hasContent ? (
        <div className="grid grid-cols-2 gap-2">
          {GETTING_STARTED.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex flex-col gap-2 rounded-lg border border-border p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/80"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}>
                <svg
                  className={`h-4 w-4 ${item.color}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => {
            const roles = team.members.map((m) => m.role).filter(Boolean);
            const rolesText = roles.length > 0 ? roles.join(", ") : "No roles assigned";
            return (
              <button
                key={team.id}
                onClick={() => router.push(`/teams`)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary/40"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{team.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{rolesText}</div>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {team.members.length}
                </span>
              </button>
            );
          })}

          {workflows.slice(0, 3).map((wf) => (
            <button
              key={wf.id}
              onClick={() => router.push(`/workflows`)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary/40"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <svg
                  className="h-4 w-4 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{wf.name}</div>
                <div className="text-xs text-muted-foreground">
                  {wf.steps.length} step{wf.steps.length !== 1 ? "s" : ""} &middot;{" "}
                  <span className="capitalize">{wf.status}</span>
                </div>
              </div>
            </button>
          ))}

          {/* Custom Team shortcut */}
          <button
            onClick={() => router.push("/teams")}
            className="flex w-full items-center gap-3 rounded-md border border-dashed border-border px-2 py-2 text-left transition-colors hover:border-zinc-600 hover:bg-secondary/40"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Custom Team</div>
              <div className="text-xs text-muted-foreground">Build from scratch</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
