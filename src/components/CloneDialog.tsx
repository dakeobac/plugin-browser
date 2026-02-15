"use client";

import { useState } from "react";
import type { GitHubRepo } from "@/lib/types";
import type { MarketplaceSource } from "../../marketplace.config";

type DialogState = "form" | "cloning" | "success" | "error";

export function CloneDialog({
  onClose,
  marketplaces,
  prefillRepo,
}: {
  onClose: () => void;
  marketplaces: MarketplaceSource[];
  prefillRepo: GitHubRepo | null;
}) {
  const [state, setState] = useState<DialogState>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultPath, setResultPath] = useState("");
  const [resultIsPlugin, setResultIsPlugin] = useState(false);
  const [resultRegistered, setResultRegistered] = useState(false);

  const [url, setUrl] = useState(
    prefillRepo ? prefillRepo.fullName : ""
  );
  const [targetMarketplace, setTargetMarketplace] = useState(
    marketplaces[0]?.id || "personal"
  );
  const [registerInManifest, setRegisterInManifest] = useState(true);

  const canSubmit = url.trim().length > 0;

  async function handleClone() {
    if (!canSubmit) return;
    setState("cloning");
    setErrorMsg("");

    try {
      const res = await fetch("/api/github/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, targetMarketplace, registerInManifest }),
      });
      const data = await res.json();

      if (data.success) {
        setState("success");
        setResultPath(data.pluginPath || "");
        setResultIsPlugin(data.isPlugin || false);
        setResultRegistered(data.registeredInManifest || false);
      } else {
        setState("error");
        setErrorMsg(data.error || "Clone failed");
      }
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl">
        {state === "success" ? (
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <svg
                className="h-6 w-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Repository Cloned
            </h2>
            <p className="text-sm text-muted-foreground">
              Cloned to{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">
                {resultPath.replace(/^\/Users\/[^/]+/, "~")}
              </code>
            </p>
            <div className="flex flex-wrap gap-2">
              {resultIsPlugin && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                  Claude Code Plugin
                </span>
              )}
              {!resultIsPlugin && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Not a plugin (no .claude-plugin)
                </span>
              )}
              {resultRegistered && (
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                  Registered in marketplace
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/plugins"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to Browse
              </a>
              <button
                onClick={onClose}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Clone Repository
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground transition-colors hover:text-accent-foreground"
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

            <div className="space-y-4">
              {/* URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  GitHub URL or owner/repo
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="owner/repo or https://github.com/..."
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Marketplace */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Target Marketplace
                </label>
                <select
                  value={targetMarketplace}
                  onChange={(e) => setTargetMarketplace(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {marketplaces.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Register */}
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={registerInManifest}
                  onChange={(e) => setRegisterInManifest(e.target.checked)}
                  className="rounded border-border bg-card"
                />
                Register in marketplace manifest
              </label>

              {/* Error */}
              {state === "error" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleClone}
                  disabled={!canSubmit || state === "cloning"}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {state === "cloning" ? "Cloning..." : "Clone"}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
