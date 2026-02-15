"use client";

import { useState } from "react";
import type { ParsedBriefSpec } from "@/lib/types";

type InputTab = "paste" | "file";

export function BriefInput({
  onParsed,
  onBriefTextChange,
}: {
  onParsed: (spec: ParsedBriefSpec) => void;
  onBriefTextChange: (text: string) => void;
}) {
  const [tab, setTab] = useState<InputTab>("paste");
  const [text, setText] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedBriefSpec | null>(null);

  async function handleLoadFile() {
    if (!filePath.trim()) return;
    setIsLoadingFile(true);
    setError(null);
    setFileInfo(null);

    try {
      const res = await fetch("/api/brief/load-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: filePath.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load file");
        return;
      }

      setText(data.text);
      onBriefTextChange(data.text);
      setFileInfo(`${data.fileName} (${data.lineCount} lines)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingFile(false);
    }
  }

  async function handleParse() {
    if (!text.trim()) return;
    setIsParsing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/brief/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to parse brief");
        return;
      }

      setResult(data);
      onParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsParsing(false);
    }
  }

  const confidenceColor =
    result?.confidence === "high"
      ? "text-green-400"
      : result?.confidence === "medium"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-card p-1">
        <button
          onClick={() => setTab("paste")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "paste"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-accent-foreground"
          }`}
        >
          Paste
        </button>
        <button
          onClick={() => setTab("file")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "file"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-accent-foreground"
          }`}
        >
          Load File
        </button>
      </div>

      {/* Paste tab */}
      {tab === "paste" && (
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onBriefTextChange(e.target.value);
          }}
          placeholder="Paste your markdown design brief here..."
          rows={12}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}

      {/* File tab */}
      {tab === "file" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="/path/to/brief.md"
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleLoadFile}
              disabled={!filePath.trim() || isLoadingFile}
              className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {isLoadingFile ? "Loading..." : "Load"}
            </button>
          </div>
          {fileInfo && (
            <p className="text-xs text-muted-foreground">
              Loaded: {fileInfo}
            </p>
          )}
          {text && tab === "file" && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card p-3">
              <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {text.slice(0, 2000)}
                {text.length > 2000 && (
                  <span className="text-muted-foreground">
                    {"\n"}... ({text.length - 2000} more characters)
                  </span>
                )}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Parse button */}
      <button
        onClick={handleParse}
        disabled={!text.trim() || isParsing}
        className="w-full rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        {isParsing ? "Parsing..." : "Parse Brief"}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Results bar */}
      {result && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground">{result.summary}</p>
            <span className={`text-xs font-medium ${confidenceColor}`}>
              {result.confidence} confidence
            </span>
          </div>
          {result.commands.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Commands: {result.commands.join(", ")}
            </p>
          )}
          {result.skills.length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Skills: {result.skills.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
