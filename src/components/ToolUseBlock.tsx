"use client";

import { useState } from "react";

export function ToolUseBlock({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}) {
  const [expanded, setExpanded] = useState(false);

  // Build a short preview based on tool type
  let preview = "";
  if (name === "Read" && input.file_path) {
    preview = String(input.file_path);
  } else if (name === "Edit" && input.file_path) {
    preview = String(input.file_path);
  } else if (name === "Write" && input.file_path) {
    preview = String(input.file_path);
  } else if (name === "Bash" && input.command) {
    preview = String(input.command).slice(0, 80);
  } else if (name === "Glob" && input.pattern) {
    preview = String(input.pattern);
  } else if (name === "Grep" && input.pattern) {
    preview = String(input.pattern);
  } else {
    const keys = Object.keys(input);
    if (keys.length > 0) {
      preview = keys.slice(0, 3).join(", ");
    }
  }

  return (
    <div className="my-1 rounded-lg border border-border bg-card/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent/50 transition-colors"
      >
        <svg
          className={`h-3 w-3 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-mono font-medium text-amber-400">{name}</span>
        {preview && (
          <span className="truncate text-muted-foreground">{preview}</span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-border px-3 py-2">
          <pre className="overflow-x-auto text-xs text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(input, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
