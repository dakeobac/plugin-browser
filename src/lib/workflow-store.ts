import getDb from "./db";
import type { Workflow, WorkflowTrigger, WorkflowStep, WorkflowRun, WorkflowStepResult } from "./types";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createWorkflow(opts: {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
}): Workflow {
  const db = getDb();
  const id = generateId("wf");
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO workflows (id, name, description, trigger_config, steps, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'inactive', ?, ?)
  `).run(id, opts.name, opts.description, JSON.stringify(opts.trigger), JSON.stringify(opts.steps), now, now);

  return {
    id,
    name: opts.name,
    description: opts.description,
    trigger: opts.trigger,
    steps: opts.steps,
    status: "inactive",
    createdAt: now,
    updatedAt: now,
  };
}

export function getWorkflow(id: string): Workflow | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM workflows WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return rowToWorkflow(row);
}

export function listWorkflows(): Workflow[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM workflows ORDER BY updated_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToWorkflow);
}

export function updateWorkflow(id: string, updates: Partial<Pick<Workflow, "name" | "description" | "trigger" | "steps" | "status">>): Workflow | undefined {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) { sets.push("name = ?"); values.push(updates.name); }
  if (updates.description !== undefined) { sets.push("description = ?"); values.push(updates.description); }
  if (updates.trigger !== undefined) { sets.push("trigger_config = ?"); values.push(JSON.stringify(updates.trigger)); }
  if (updates.steps !== undefined) { sets.push("steps = ?"); values.push(JSON.stringify(updates.steps)); }
  if (updates.status !== undefined) { sets.push("status = ?"); values.push(updates.status); }

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  if (sets.length === 1) return getWorkflow(id); // only updated_at
  db.prepare(`UPDATE workflows SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getWorkflow(id);
}

export function deleteWorkflow(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM workflows WHERE id = ?").run(id);
  return result.changes > 0;
}

// --- Workflow Runs ---

export function createWorkflowRun(workflowId: string, initialInput?: Record<string, unknown>): WorkflowRun {
  const db = getDb();
  const id = generateId("run");
  const now = new Date().toISOString();
  const blackboard = initialInput || {};

  db.prepare(`
    INSERT INTO workflow_runs (id, workflow_id, status, started_at, step_results, blackboard)
    VALUES (?, ?, 'running', ?, '{}', ?)
  `).run(id, workflowId, now, JSON.stringify(blackboard));

  // Update workflow last run
  db.prepare("UPDATE workflows SET last_run_at = ?, last_run_status = 'running', status = 'running' WHERE id = ?")
    .run(now, workflowId);

  return {
    id,
    workflowId,
    status: "running",
    startedAt: now,
    stepResults: {},
    blackboard,
  };
}

export function getWorkflowRun(id: string): WorkflowRun | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM workflow_runs WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  return rowToRun(row);
}

export function listWorkflowRuns(workflowId: string, limit = 20): WorkflowRun[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC LIMIT ?")
    .all(workflowId, limit) as Record<string, unknown>[];
  return rows.map(rowToRun);
}

export function updateWorkflowRun(id: string, updates: {
  status?: WorkflowRun["status"];
  stepResults?: Record<string, WorkflowStepResult>;
  blackboard?: Record<string, unknown>;
  completedAt?: string;
  error?: string;
}): void {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.status !== undefined) { sets.push("status = ?"); values.push(updates.status); }
  if (updates.stepResults !== undefined) { sets.push("step_results = ?"); values.push(JSON.stringify(updates.stepResults)); }
  if (updates.blackboard !== undefined) { sets.push("blackboard = ?"); values.push(JSON.stringify(updates.blackboard)); }
  if (updates.completedAt !== undefined) { sets.push("completed_at = ?"); values.push(updates.completedAt); }
  if (updates.error !== undefined) { sets.push("error = ?"); values.push(updates.error); }

  if (sets.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE workflow_runs SET ${sets.join(", ")} WHERE id = ?`).run(...values);

  // Update parent workflow status if completed or errored
  if (updates.status === "completed" || updates.status === "error") {
    const run = getWorkflowRun(id);
    if (run) {
      db.prepare("UPDATE workflows SET last_run_status = ?, status = 'active' WHERE id = ?")
        .run(updates.status, run.workflowId);
    }
  }
}

function rowToWorkflow(row: Record<string, unknown>): Workflow {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    trigger: JSON.parse(row.trigger_config as string),
    steps: JSON.parse(row.steps as string),
    status: row.status as Workflow["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastRunAt: row.last_run_at as string | undefined,
    lastRunStatus: row.last_run_status as Workflow["lastRunStatus"],
  };
}

function rowToRun(row: Record<string, unknown>): WorkflowRun {
  return {
    id: row.id as string,
    workflowId: row.workflow_id as string,
    status: row.status as WorkflowRun["status"],
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string | undefined,
    stepResults: JSON.parse(row.step_results as string),
    blackboard: JSON.parse(row.blackboard as string),
    error: row.error as string | undefined,
  };
}
