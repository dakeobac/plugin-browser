"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBuild } from "./BuildProvider";
import { ChatMessage } from "./ChatMessage";
import type { BackgroundBuild } from "@/lib/types";

function ElapsedTime({ since }: { since: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((Date.now() - since) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="tabular-nums text-xs text-muted-foreground">
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

function LogModal({
  build,
  onClose,
}: {
  build: BackgroundBuild;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 flex h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-sm font-bold text-foreground">
            Build Log: {build.pluginName}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {build.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages recorded.</p>
          ) : (
            build.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function BuildStatusWidget() {
  const { builds, dismissBuild } = useBuild();
  const [viewingBuildId, setViewingBuildId] = useState<string | null>(null);

  if (builds.length === 0) return null;

  const viewingBuild = viewingBuildId
    ? builds.find((b) => b.id === viewingBuildId)
    : null;

  return (
    <>
      {viewingBuild && (
        <LogModal
          build={viewingBuild}
          onClose={() => setViewingBuildId(null)}
        />
      )}
      <div
        className="fixed bottom-4 right-4 z-50 w-80"
        style={{ animation: "slide-up-in 0.3s ease-out" }}
      >
        <div className="rounded-xl border border-border bg-popover/95 backdrop-blur shadow-2xl">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs font-semibold text-foreground">
              Plugin Builds
            </p>
          </div>
          <div className="divide-y divide-border">
            {builds.map((build) => (
              <div key={build.id} className="px-4 py-3">
                {build.status === "building" && (
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {build.pluginName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Building...
                      </p>
                    </div>
                    <ElapsedTime since={build.startedAt} />
                  </div>
                )}

                {build.status === "done" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-green-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {build.pluginName}
                        </p>
                        <p className="text-xs text-green-400">
                          Build complete
                        </p>
                      </div>
                      <button
                        onClick={() => dismissBuild(build.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/agent?plugin=${encodeURIComponent(build.pluginName)}&cwd=${encodeURIComponent(build.pluginPath)}`}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                      >
                        Try Plugin
                      </Link>
                      <button
                        onClick={() => setViewingBuildId(build.id)}
                        className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        View Log
                      </button>
                    </div>
                  </div>
                )}

                {build.status === "error" && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {build.pluginName}
                      </p>
                      <p className="text-xs text-red-400 truncate">
                        {build.error || "Build failed"}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissBuild(build.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Dismiss"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
