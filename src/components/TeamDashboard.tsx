"use client";

import { useState, useEffect, useCallback } from "react";
import type { Team, BusEvent, BlackboardEntry } from "@/lib/types";
import { TeamCreator } from "./TeamCreator";
import { BlackboardView } from "./BlackboardView";

export function TeamDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<BusEvent[]>([]);
  const [blackboard, setBlackboard] = useState<BlackboardEntry[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "events" | "blackboard">("overview");

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      setTeams(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const selected = teams.find((t) => t.id === selectedId);

  // Fetch events and blackboard for selected team
  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/teams/${selectedId}/events`).then((r) => r.json()).then(setEvents).catch(() => {});
    fetch(`/api/teams/${selectedId}/blackboard`).then((r) => r.json()).then(setBlackboard).catch(() => {});
  }, [selectedId]);

  async function handleStart() {
    if (!selectedId || !promptText.trim()) return;
    setRunning(true);

    try {
      const res = await fetch(`/api/teams/${selectedId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        // Could process SSE events here for live updates
      }
    } finally {
      setRunning(false);
      setPromptText("");
      // Refresh
      fetch(`/api/teams/${selectedId}/events`).then((r) => r.json()).then(setEvents).catch(() => {});
      fetch(`/api/teams/${selectedId}/blackboard`).then((r) => r.json()).then(setBlackboard).catch(() => {});
      fetchTeams();
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    await fetch(`/api/teams/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    fetchTeams();
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading teams...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Team list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Teams</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            + New
          </button>
        </div>

        {teams.length === 0 && (
          <p className="text-sm text-muted-foreground">No teams yet. Create one to get started.</p>
        )}

        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => { setSelectedId(team.id); setTab("overview"); }}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              selectedId === team.id
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-border bg-card hover:border-blue-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-foreground">{team.name}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 ${
                team.status === "active" ? "bg-green-500/20 text-green-400" :
                team.status === "error" ? "bg-red-500/20 text-red-400" :
                "bg-muted text-muted-foreground"
              }`}>
                {team.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{team.description}</p>
            <span className="text-xs text-muted-foreground">{team.members.length} members</span>
          </button>
        ))}
      </div>

      {/* Right: Team detail */}
      <div className="lg:col-span-2 space-y-4">
        {!selected && (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
            Select a team to view details
          </div>
        )}

        {selected && (
          <>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
            </div>

            {/* Start team prompt */}
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="text-sm font-medium text-foreground">Start Team Session</label>
              <div className="flex gap-2 mt-2">
                <input
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Enter a task for the team..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  disabled={running}
                />
                <button
                  onClick={handleStart}
                  disabled={running || !promptText.trim()}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {running ? "Running..." : "Start"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {(["overview", "events", "blackboard"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    tab === t
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Members</h4>
                {selected.members.map((m) => (
                  <div key={m.agentId} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{m.agentId}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{m.role}</span>
                        {m.agentId === selected.supervisorId && (
                          <span className="text-xs rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-400">Supervisor</span>
                        )}
                      </div>
                    </div>
                    {m.capabilities.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {m.capabilities.map((c) => (
                          <span key={c} className="text-xs rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-400">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "events" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Events ({events.length})</h4>
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground">No events yet.</p>
                )}
                {events.map((evt) => (
                  <div key={evt.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-blue-400">{evt.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">from: {evt.source}</span>
                    {Object.keys(evt.payload).length > 0 && (
                      <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "blackboard" && (
              <BlackboardView entries={blackboard} teamId={selected.id} />
            )}
          </>
        )}
      </div>

      {showCreate && (
        <TeamCreator
          onClose={() => setShowCreate(false)}
          onCreated={fetchTeams}
        />
      )}
    </div>
  );
}
