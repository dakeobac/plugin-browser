"use client";

import { useState } from "react";
import type { WorkflowStep, AgentRuntime } from "@/lib/types";

function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function WorkflowStepEditor({
  steps,
  onChange,
}: {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function addStep() {
    const newStep: WorkflowStep = {
      id: generateStepId(),
      name: `Step ${steps.length + 1}`,
      agentId: "",
      prompt: "",
    };
    onChange([...steps, newStep]);
    setExpanded(newStep.id);
  }

  function updateStep(id: string, updates: Partial<WorkflowStep>) {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function removeStep(id: string) {
    onChange(steps.filter((s) => s.id !== id));
    if (expanded === id) setExpanded(null);
  }

  function moveStep(id: string, direction: -1 | 1) {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[idx], newSteps[newIdx]] = [newSteps[newIdx], newSteps[idx]];
    onChange(newSteps);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Steps</label>
        <button
          onClick={addStep}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          + Add Step
        </button>
      </div>

      {steps.map((step, i) => (
        <div key={step.id} className="rounded-md border border-border bg-background p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">
              {i + 1}
            </span>
            <button
              onClick={() => setExpanded(expanded === step.id ? null : step.id)}
              className="flex-1 text-left text-sm font-medium text-foreground hover:text-blue-400"
            >
              {step.name || `Step ${i + 1}`}
            </button>
            <div className="flex gap-1">
              <button onClick={() => moveStep(step.id, -1)} className="text-xs text-muted-foreground hover:text-foreground" disabled={i === 0}>↑</button>
              <button onClick={() => moveStep(step.id, 1)} className="text-xs text-muted-foreground hover:text-foreground" disabled={i === steps.length - 1}>↓</button>
              <button onClick={() => removeStep(step.id)} className="text-xs text-red-400 hover:text-red-300 ml-1">×</button>
            </div>
          </div>

          {expanded === step.id && (
            <div className="space-y-2 ml-7">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    value={step.name}
                    onChange={(e) => updateStep(step.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Agent ID</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    placeholder="agent-id or agent name"
                    value={step.agentId}
                    onChange={(e) => updateStep(step.id, { agentId: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Prompt (use {"{{key}}"} for blackboard values)</label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                  rows={3}
                  value={step.prompt}
                  onChange={(e) => updateStep(step.id, { prompt: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Runtime</label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    value={step.runtime || "claude-code"}
                    onChange={(e) => updateStep(step.id, { runtime: e.target.value as AgentRuntime })}
                  >
                    <option value="claude-code">Claude Code</option>
                    <option value="opencode">OpenCode</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Output Key</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    placeholder="blackboard key"
                    value={step.outputKey || ""}
                    onChange={(e) => updateStep(step.id, { outputKey: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Timeout (s)</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    value={step.timeout || 300}
                    onChange={(e) => updateStep(step.id, { timeout: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Depends On (comma-separated step IDs)</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    value={(step.dependsOn || []).join(", ")}
                    onChange={(e) => {
                      const deps = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      updateStep(step.id, { dependsOn: deps.length ? deps : undefined });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Condition</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    placeholder="e.g. result === 'success'"
                    value={step.condition || ""}
                    onChange={(e) => updateStep(step.id, { condition: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Retries</label>
                <input
                  type="number"
                  className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                  min={0}
                  max={5}
                  value={step.retries || 0}
                  onChange={(e) => updateStep(step.id, { retries: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {steps.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">No steps yet</p>
      )}
    </div>
  );
}
