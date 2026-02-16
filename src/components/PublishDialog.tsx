"use client";

import { useState } from "react";
import type { PluginDetail } from "@/lib/types";

export function PublishDialog({
  plugin,
  onClose,
}: {
  plugin: PluginDetail;
  onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState(plugin.name);
  const [description, setDescription] = useState(plugin.description);
  const [category, setCategory] = useState(plugin.category || "");
  const [platform, setPlatform] = useState<"claude-code" | "opencode" | "both">(plugin.platform || "claude-code");
  const [tags, setTags] = useState((plugin.keywords || []).join(", "));
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; prUrl?: string; repoUrl?: string; error?: string } | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setResult(null);

    try {
      const res = await fetch("/api/ecosystem/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pluginSlug: plugin.slug,
          displayName,
          description,
          category,
          platform,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          repositoryUrl: repositoryUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResult({ success: false, error: data.error || "Publish failed" });
      } else {
        setResult(data);
      }
    } catch (err) {
      setResult({ success: false, error: (err as Error).message });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-foreground mb-1">Publish to Ecosystem</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Share <strong>{plugin.name}</strong> with the community via the plugin registry.
        </p>

        {result && (
          <div className={`mb-4 rounded-lg border p-3 ${
            result.success
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {result.success ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">Published successfully!</p>
                {result.prUrl && (
                  <a href={result.prUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                    View Pull Request
                  </a>
                )}
                {result.repoUrl && (
                  <a href={result.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline block">
                    View Repository
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm">{result.error}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="e.g. developer-tools"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Platform</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as typeof platform)}
              >
                <option value="claude-code">Claude Code</option>
                <option value="opencode">OpenCode</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Tags (comma-separated)</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="e.g. seo, analytics, automation"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Repository URL (optional)</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="https://github.com/user/plugin-name"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use the git remote origin of the plugin directory.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {result?.success ? "Close" : "Cancel"}
          </button>
          {!result?.success && (
            <button
              onClick={handlePublish}
              disabled={publishing || !displayName.trim() || !description.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
