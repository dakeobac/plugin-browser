"use client";

import { useState } from "react";
import type { BlackboardEntry } from "@/lib/types";

export function BlackboardView({
  entries,
  teamId,
}: {
  entries: BlackboardEntry[];
  teamId: string;
}) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [localEntries, setLocalEntries] = useState(entries);

  async function handleAdd() {
    if (!newKey.trim()) return;

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(newValue);
    } catch {
      parsedValue = newValue;
    }

    const res = await fetch(`/api/teams/${teamId}/blackboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: newKey, value: parsedValue, updatedBy: "ui" }),
    });

    if (res.ok) {
      const entry = await res.json();
      setLocalEntries((prev) => {
        const existing = prev.findIndex((e) => e.key === entry.key);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = entry;
          return updated;
        }
        return [entry, ...prev];
      });
      setNewKey("");
      setNewValue("");
    }
  }

  async function handleDelete(key: string) {
    const res = await fetch(`/api/teams/${teamId}/blackboard?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setLocalEntries((prev) => prev.filter((e) => e.key !== key));
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Blackboard ({localEntries.length} entries)</h4>

      {/* Add entry */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            placeholder="Key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            placeholder="Value (JSON or string)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newKey.trim()}
          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Add Entry
        </button>
      </div>

      {/* Entries */}
      {localEntries.length === 0 && (
        <p className="text-sm text-muted-foreground">No blackboard entries.</p>
      )}

      {localEntries.map((entry) => (
        <div key={entry.key} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-blue-400">{entry.key}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">v{entry.version}</span>
              <button
                onClick={() => handleDelete(entry.key)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="mt-1">
            <pre className="text-xs text-muted-foreground overflow-x-auto max-h-24 overflow-y-auto">
              {typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value, null, 2)}
            </pre>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Updated by {entry.updatedBy} · {new Date(entry.updatedAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
