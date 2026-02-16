"use client";

import { useState, useEffect } from "react";
import type { AgentInstanceSummary, TeamMember } from "@/lib/types";

export function TeamCreator({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agents, setAgents] = useState<AgentInstanceSummary[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [supervisorId, setSupervisorId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then(setAgents)
      .catch(() => {});
  }, []);

  function addMember(agentId: string) {
    if (members.some((m) => m.agentId === agentId)) return;
    setMembers([...members, { agentId, role: "worker", capabilities: [] }]);
  }

  function removeMember(agentId: string) {
    setMembers(members.filter((m) => m.agentId !== agentId));
    if (supervisorId === agentId) setSupervisorId("");
  }

  function updateMember(agentId: string, updates: Partial<TeamMember>) {
    setMembers(members.map((m) => (m.agentId === agentId ? { ...m, ...updates } : m)));
  }

  async function handleCreate() {
    if (!name.trim() || members.length === 0) return;
    setCreating(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          supervisorId: supervisorId || undefined,
          members,
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-foreground mb-4">Create Team</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Team Name</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="e.g. Code Review Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              rows={2}
              placeholder="What does this team do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Agent selector */}
          <div>
            <label className="text-sm font-medium text-foreground">Add Members</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {agents.filter((a) => !members.some((m) => m.agentId === a.id)).map((a) => (
                <button
                  key={a.id}
                  onClick={() => addMember(a.id)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-blue-500/30 hover:text-blue-400 transition-colors"
                >
                  + {a.displayName}
                </button>
              ))}
              {agents.length === 0 && (
                <p className="text-xs text-muted-foreground">No agents available. Create agents first.</p>
              )}
            </div>
          </div>

          {/* Members list */}
          {members.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Members</label>
              {members.map((m) => {
                const agent = agents.find((a) => a.id === m.agentId);
                return (
                  <div key={m.agentId} className="rounded-md border border-border bg-background p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {agent?.displayName || m.agentId}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSupervisorId(m.agentId)}
                          className={`text-xs rounded-full px-2 py-0.5 ${
                            supervisorId === m.agentId
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {supervisorId === m.agentId ? "Supervisor" : "Set as Supervisor"}
                        </button>
                        <button
                          onClick={() => removeMember(m.agentId)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Role</label>
                        <input
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                          value={m.role}
                          onChange={(e) => updateMember(m.agentId, { role: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Capabilities (comma-separated)</label>
                        <input
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                          value={m.capabilities.join(", ")}
                          onChange={(e) => updateMember(m.agentId, {
                            capabilities: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim() || members.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
}
