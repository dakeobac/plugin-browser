"use client";

import { useState } from "react";
import type { PluginSuggestion, ScaffoldRequest, ParsedBriefSpec } from "@/lib/types";
import type { MarketplaceSource } from "../../marketplace.config";
import { CATEGORIES } from "@/lib/category-colors";
import { BriefInput } from "./BriefInput";
import { useBuild } from "./BuildProvider";

type DialogState = "form" | "loading" | "success" | "error";
type InputMode = "form" | "brief";

export function CreatePluginDialog({
  onClose,
  marketplaces,
  prefill,
  initialMode = "form",
}: {
  onClose: () => void;
  marketplaces: MarketplaceSource[];
  prefill: PluginSuggestion | null;
  initialMode?: InputMode;
}) {
  const { startBuild } = useBuild();
  const [state, setState] = useState<DialogState>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultPath, setResultPath] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>(initialMode);
  const [briefText, setBriefText] = useState("");

  const [name, setName] = useState(prefill?.suggestedName || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const [category, setCategory] = useState(prefill?.suggestedCategory || "");
  const [targetMarketplace, setTargetMarketplace] = useState(
    marketplaces[0]?.id || ""
  );
  const [commands, setCommands] = useState(
    prefill?.suggestedCommands.join(", ") || ""
  );
  const [skills, setSkills] = useState(
    prefill?.suggestedSkills.join(", ") || ""
  );
  const [agents, setAgents] = useState(
    prefill?.suggestedAgents.join(", ") || ""
  );
  const [includeMcp, setIncludeMcp] = useState(prefill?.hasMcp || false);
  const [includeHooks, setIncludeHooks] = useState(
    prefill?.hasHooks || false
  );
  const [registerInManifest, setRegisterInManifest] = useState(true);

  const nameValid = /^[a-z][a-z0-9-]*$/.test(name);
  const canSubmit = name.length > 0 && nameValid && description.length > 0;

  function handleParsed(spec: ParsedBriefSpec) {
    if (spec.name) setName(spec.name);
    if (spec.description) setDescription(spec.description);
    if (spec.category) setCategory(spec.category);
    if (spec.commands.length > 0) setCommands(spec.commands.join(", "));
    if (spec.skills.length > 0) setSkills(spec.skills.join(", "));
    if (spec.agents.length > 0) setAgents(spec.agents.join(", "));
    setIncludeMcp(spec.hasMcp);
    setIncludeHooks(spec.hasHooks);
  }

  // Build directory tree preview
  function buildTreePreview(): string[] {
    const lines: string[] = [`${name}/`];
    lines.push("  .claude-plugin/");
    lines.push("    plugin.json");
    lines.push("  README.md");

    const cmdList = commands
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cmdList.length > 0) {
      lines.push("  commands/");
      for (const c of cmdList) {
        lines.push(`    ${c}.md`);
      }
    }

    const skillList = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillList.length > 0) {
      lines.push("  skills/");
      for (const s of skillList) {
        lines.push(`    ${s}/`);
        lines.push(`      SKILL.md`);
        lines.push(`      references/`);
      }
    }

    const agentList = agents
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    if (agentList.length > 0) {
      lines.push("  agents/");
      for (const a of agentList) {
        lines.push(`    ${a}.md`);
      }
    }

    if (includeMcp) lines.push("  .mcp.json");
    if (includeHooks) {
      lines.push("  hooks/");
      lines.push("    hooks.json");
    }

    return lines;
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setState("loading");
    setErrorMsg("");

    const request: ScaffoldRequest = {
      name,
      description,
      category: category || undefined,
      targetMarketplace,
      commands: commands
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      agents: agents
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      includeMcp,
      includeHooks,
      registerInManifest,
    };

    try {
      const res = await fetch("/api/create-plugin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();

      if (data.success) {
        setState("success");
        setResultPath(data.pluginPath || "");
      } else {
        setState("error");
        setErrorMsg(data.error || "Unknown error");
      }
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  function buildInitialPrompt(): string {
    const parts = [
      `I've just scaffolded a new Claude Code plugin called "${name}" at ${resultPath}.`,
      `Description: ${description}`,
    ];
    if (category) parts.push(`Category: ${category}`);
    const cmdList = commands.split(",").map((c) => c.trim()).filter(Boolean);
    if (cmdList.length > 0) parts.push(`Commands: ${cmdList.join(", ")}`);
    const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skillList.length > 0) parts.push(`Skills: ${skillList.join(", ")}`);
    const agentList = agents.split(",").map((a) => a.trim()).filter(Boolean);
    if (agentList.length > 0) parts.push(`Agents: ${agentList.join(", ")}`);
    if (includeMcp) parts.push("Includes MCP server config.");
    if (includeHooks) parts.push("Includes hooks.");

    if (briefText.trim()) {
      parts.push("");
      parts.push("## Full Design Brief");
      parts.push("");
      parts.push("Below is the complete design brief. Use this as the authoritative specification for implementation.");
      parts.push("");
      parts.push(briefText);
      parts.push("");
    }

    parts.push("");
    parts.push("Please implement this plugin using /plugin-dev:create-plugin");
    return parts.join("\n");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border bg-background shadow-2xl max-w-2xl p-6">
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
              Plugin Scaffolded
            </h2>
            <p className="text-sm text-muted-foreground">
              Created at{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">
                {resultPath.replace(/^\/Users\/[^/]+/, "~")}
              </code>
            </p>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-foreground">
                Next step: open in your editor and run{" "}
                <code className="rounded bg-secondary px-1.5 py-0.5 text-blue-400">
                  /plugin-dev:create-plugin
                </code>{" "}
                to fill in the implementation.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  startBuild({
                    pluginName: name,
                    pluginPath: resultPath,
                    initialPrompt: buildInitialPrompt(),
                  });
                  onClose();
                }}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Build with Claude Code
              </button>
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
                Create Plugin
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
              {/* Mode toggle */}
              <div className="flex gap-1 rounded-lg bg-card p-1">
                <button
                  onClick={() => setInputMode("form")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    inputMode === "form"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-accent-foreground"
                  }`}
                >
                  Structured
                </button>
                <button
                  onClick={() => setInputMode("brief")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    inputMode === "brief"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-accent-foreground"
                  }`}
                >
                  From Brief
                </button>
              </div>

              {/* Brief input (shown in brief mode) */}
              {inputMode === "brief" && (
                <BriefInput
                  onParsed={handleParsed}
                  onBriefTextChange={setBriefText}
                />
              )}

              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Plugin Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-plugin"
                  className={`w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 ${
                    name.length > 0 && !nameValid
                      ? "border-red-500/50 focus:ring-red-500"
                      : "border-border focus:ring-ring"
                  }`}
                />
                {name.length > 0 && !nameValid && (
                  <p className="mt-1 text-xs text-red-400">
                    Must start with a letter, lowercase, hyphens only
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this plugin does"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Category + Marketplace */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">None</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>

              {/* Commands */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Commands{" "}
                  <span className="text-muted-foreground">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={commands}
                  onChange={(e) => setCommands(e.target.value)}
                  placeholder="audit, setup, report"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Skills{" "}
                  <span className="text-muted-foreground">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="workflow, review"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Agents */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Agents{" "}
                  <span className="text-muted-foreground">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={agents}
                  onChange={(e) => setAgents(e.target.value)}
                  placeholder="reviewer, builder"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Feature toggles */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={includeMcp}
                    onChange={(e) => setIncludeMcp(e.target.checked)}
                    className="rounded border-border bg-card"
                  />
                  MCP Server
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={includeHooks}
                    onChange={(e) => setIncludeHooks(e.target.checked)}
                    className="rounded border-border bg-card"
                  />
                  Hooks
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={registerInManifest}
                    onChange={(e) => setRegisterInManifest(e.target.checked)}
                    className="rounded border-border bg-card"
                  />
                  Register in marketplace
                </label>
              </div>

              {/* Directory tree preview */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Directory Preview
                </label>
                <pre className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground overflow-x-auto">
                  {buildTreePreview().join("\n")}
                </pre>
              </div>

              {/* Error */}
              {state === "error" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || state === "loading"}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {state === "loading" ? "Creating..." : "Create Plugin"}
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
