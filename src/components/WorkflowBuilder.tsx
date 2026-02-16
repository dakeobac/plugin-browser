"use client";

import { useState, useEffect, useCallback } from "react";
import type { Workflow, WorkflowStep, WorkflowTrigger, WorkflowRun } from "@/lib/types";
import { WorkflowStepEditor } from "./WorkflowStepEditor";
import { WorkflowRunView } from "./WorkflowRunView";

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [activeRun, setActiveRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(true);

  // New workflow form
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTrigger, setNewTrigger] = useState<WorkflowTrigger>({ type: "manual" });
  const [newSteps, setNewSteps] = useState<WorkflowStep[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      setWorkflows(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const selected = workflows.find((w) => w.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/workflows/${selectedId}/runs`)
      .then((r) => r.json())
      .then(setRuns)
      .catch(() => {});
  }, [selectedId]);

  async function handleCreate() {
    if (!newName.trim()) return;
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        description: newDescription,
        trigger: newTrigger,
        steps: newSteps,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setNewTrigger({ type: "manual" });
      setNewSteps([]);
      fetchWorkflows();
    }
  }

  async function handleRun() {
    if (!selectedId) return;
    setActiveRun(null);

    const res = await fetch(`/api/workflows/${selectedId}/run`, { method: "POST" });
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

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "workflow_run") {
            setActiveRun(data.run);
          }
        } catch {
          /* malformed */
        }
      }
    }

    // Refresh runs
    fetch(`/api/workflows/${selectedId}/runs`)
      .then((r) => r.json())
      .then(setRuns)
      .catch(() => {});
  }

  async function handleDelete() {
    if (!selectedId) return;
    await fetch(`/api/workflows/${selectedId}`, { method: "DELETE" });
    setSelectedId(null);
    fetchWorkflows();
  }

  async function handleUpdate(updates: Partial<Workflow>) {
    if (!selectedId) return;
    await fetch(`/api/workflows/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchWorkflows();
    setEditing(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading workflows...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Workflow list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Workflows</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            + New
          </button>
        </div>

        {workflows.length === 0 && !showCreate && (
          <p className="text-sm text-muted-foreground">No workflows yet. Create one to get started.</p>
        )}

        {showCreate && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Workflow name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Description"
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <div>
              <label className="text-xs font-medium text-muted-foreground">Trigger</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground mt-1"
                value={newTrigger.type}
                onChange={(e) => {
                  const t = e.target.value as WorkflowTrigger["type"];
                  if (t === "manual") setNewTrigger({ type: "manual" });
                  else if (t === "cron") setNewTrigger({ type: "cron", schedule: "0 * * * *" });
                  else if (t === "event") setNewTrigger({ type: "event", eventPattern: "task.*" });
                  else if (t === "webhook") setNewTrigger({ type: "webhook", path: "/hook" });
                }}
              >
                <option value="manual">Manual</option>
                <option value="cron">Cron Schedule</option>
                <option value="event">Event Pattern</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            <WorkflowStepEditor steps={newSteps} onChange={setNewSteps} />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {workflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => { setSelectedId(wf.id); setEditing(false); setActiveRun(null); }}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              selectedId === wf.id
                ? "border-blue-500/50 bg-blue-500/10"
                : "border-border bg-card hover:border-blue-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-foreground">{wf.name}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 ${
                wf.status === "active" ? "bg-green-500/20 text-green-400" :
                wf.status === "running" ? "bg-blue-500/20 text-blue-400" :
                "bg-muted text-muted-foreground"
              }`}>
                {wf.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{wf.description}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{wf.steps.length} steps</span>
              <span>·</span>
              <span>{wf.trigger.type}</span>
              {wf.lastRunStatus && (
                <>
                  <span>·</span>
                  <span className={wf.lastRunStatus === "error" ? "text-red-400" : "text-green-400"}>
                    last: {wf.lastRunStatus}
                  </span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Right: Detail & Run */}
      <div className="lg:col-span-2 space-y-4">
        {!selected && !activeRun && (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
            Select a workflow to view details or run it
          </div>
        )}

        {selected && !activeRun && (
          <>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleRun}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    Run
                  </button>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {editing ? "Cancel" : "Edit"}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <div className="mt-3 text-xs text-muted-foreground">
                Trigger: {selected.trigger.type}
                {"schedule" in selected.trigger && ` — ${selected.trigger.schedule}`}
                {"eventPattern" in selected.trigger && ` — ${selected.trigger.eventPattern}`}
                {"path" in selected.trigger && ` — ${selected.trigger.path}`}
              </div>
            </div>

            {editing ? (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <WorkflowStepEditor
                  steps={selected.steps}
                  onChange={(steps) => handleUpdate({ steps })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Steps ({selected.steps.length})</h4>
                {selected.steps.map((step, i) => (
                  <div key={step.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-medium text-blue-400">
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm text-foreground">{step.name}</span>
                      {step.dependsOn && step.dependsOn.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          depends on: {step.dependsOn.join(", ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-8 line-clamp-2">{step.prompt}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Run history */}
            {runs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Run History</h4>
                {runs.slice(0, 5).map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setActiveRun(run)}
                    className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground font-mono">{run.id.slice(0, 16)}</span>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        run.status === "completed" ? "bg-green-500/20 text-green-400" :
                        run.status === "error" ? "bg-red-500/20 text-red-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.startedAt).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeRun && (
          <div>
            <button
              onClick={() => setActiveRun(null)}
              className="text-sm text-blue-400 hover:text-blue-300 mb-3"
            >
              ← Back to workflow
            </button>
            <WorkflowRunView run={activeRun} steps={selected?.steps || []} />
          </div>
        )}
      </div>
    </div>
  );
}
