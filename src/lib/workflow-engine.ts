import type { Workflow, WorkflowStep, WorkflowRun, WorkflowStepResult } from "./types";
import { createWorkflowRun, updateWorkflowRun, getWorkflowRun } from "./workflow-store";
import { launchAgent } from "./agent-launcher";
import { createAgent, getAgent, getAllAgents } from "./agent-registry";
import { createTrace } from "./trace-store";
import { insertLog } from "./log-store";
import type { ClaudeEvent } from "./types";

/**
 * Resolve steps into execution layers based on dependsOn.
 * Returns arrays of steps that can run in parallel within each layer.
 */
function resolveDAG(steps: WorkflowStep[]): WorkflowStep[][] {
  const layers: WorkflowStep[][] = [];
  const completed = new Set<string>();
  const remaining = new Map(steps.map((s) => [s.id, s]));

  while (remaining.size > 0) {
    const layer: WorkflowStep[] = [];

    for (const [id, step] of remaining) {
      const deps = step.dependsOn || [];
      if (deps.every((d) => completed.has(d))) {
        layer.push(step);
      }
    }

    if (layer.length === 0) {
      // Circular dependency or missing deps — add remaining as final layer
      insertLog({
        level: "warn",
        source: "workflow-engine",
        message: `Unresolvable dependencies in workflow. Forcing remaining ${remaining.size} steps.`,
      });
      layers.push(Array.from(remaining.values()));
      break;
    }

    for (const step of layer) {
      remaining.delete(step.id);
      completed.add(step.id);
    }
    layers.push(layer);
  }

  return layers;
}

/**
 * Safe dot-path accessor for blackboard values.
 * Evaluates simple conditions like "blackboard.key === 'value'"
 */
function evaluateCondition(condition: string, blackboard: Record<string, unknown>): boolean {
  // Simple key existence check
  if (!condition.includes("===") && !condition.includes("!==")) {
    return getNestedValue(blackboard, condition) !== undefined;
  }

  // Simple equality: "key === 'value'" or "key !== 'value'"
  const isNot = condition.includes("!==");
  const parts = condition.split(isNot ? "!==" : "===").map((s) => s.trim());
  if (parts.length !== 2) return true; // Can't parse — proceed

  const left = getNestedValue(blackboard, parts[0]);
  let right: unknown = parts[1];

  // Unquote string values
  if (typeof right === "string" && right.startsWith("'") && right.endsWith("'")) {
    right = right.slice(1, -1);
  } else if (typeof right === "string" && right.startsWith('"') && right.endsWith('"')) {
    right = right.slice(1, -1);
  } else if (right === "true") {
    right = true;
  } else if (right === "false") {
    right = false;
  } else if (typeof right === "string" && !isNaN(Number(right))) {
    right = Number(right);
  }

  return isNot ? left !== right : left === right;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Interpolate blackboard values in prompt template.
 * {{key}} → blackboard[key]
 */
function interpolatePrompt(template: string, blackboard: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const val = getNestedValue(blackboard, key.trim());
    if (val === undefined) return `{{${key}}}`;
    return typeof val === "string" ? val : JSON.stringify(val);
  });
}

/**
 * Execute a single workflow step.
 */
async function executeStep(
  step: WorkflowStep,
  run: WorkflowRun,
  onUpdate: (run: WorkflowRun) => void,
): Promise<WorkflowStepResult> {
  const result: WorkflowStepResult = {
    stepId: step.id,
    status: "running",
    startedAt: new Date().toISOString(),
  };

  // Check condition
  if (step.condition && !evaluateCondition(step.condition, run.blackboard)) {
    result.status = "skipped";
    result.completedAt = new Date().toISOString();
    return result;
  }

  // Interpolate prompt
  const prompt = interpolatePrompt(step.prompt, run.blackboard);

  // Create trace for this step
  const trace = createTrace({
    agentId: step.agentId,
    agentName: `Workflow step: ${step.name}`,
    runtime: step.runtime || "claude-code",
    promptPreview: prompt.slice(0, 200),
  });
  result.traceId = trace.traceId;

  // Find or create agent
  let agent = getAgent(step.agentId);
  if (!agent) {
    // Check if agentId refers to a registered agent name
    const allAgents = getAllAgents();
    const match = allAgents.find((a) => a.agentName === step.agentId || a.id === step.agentId);
    if (match) {
      agent = getAgent(match.id);
    }
  }

  if (!agent) {
    // Create ephemeral agent for this step
    agent = createAgent({
      agentName: step.name,
      displayName: `Workflow: ${step.name}`,
      config: {
        runtime: step.runtime || "claude-code",
      },
    });
  }

  return new Promise<WorkflowStepResult>((resolve) => {
    const output: string[] = [];
    const timeoutMs = (step.timeout || 300) * 1000; // default 5 min

    const timer = setTimeout(() => {
      result.status = "error";
      result.error = "Step timed out";
      result.completedAt = new Date().toISOString();
      resolve(result);
    }, timeoutMs);

    launchAgent(agent!.id, prompt, (event: ClaudeEvent) => {
      if (event.type === "assistant" && event.message?.content) {
        for (const block of event.message.content) {
          if (block.type === "text") {
            output.push(block.text);
          }
        }
      } else if (event.type === "done") {
        clearTimeout(timer);
        result.status = "completed";
        result.completedAt = new Date().toISOString();
        result.output = output.join("\n");

        // Write output to blackboard if outputKey specified
        if (step.outputKey && result.output) {
          run.blackboard[step.outputKey] = result.output;
        }

        resolve(result);
      } else if (event.type === "error") {
        clearTimeout(timer);
        result.status = "error";
        result.error = (event as { message?: string }).message || "Unknown error";
        result.completedAt = new Date().toISOString();
        resolve(result);
      }
    }).catch((err) => {
      clearTimeout(timer);
      result.status = "error";
      result.error = (err as Error).message;
      result.completedAt = new Date().toISOString();
      resolve(result);
    });
  });
}

/**
 * Execute a workflow.
 * Creates a run, resolves DAG, executes layers in parallel.
 */
export async function executeWorkflow(workflow: Workflow, initialInput?: Record<string, unknown>): Promise<WorkflowRun> {
  const run = createWorkflowRun(workflow.id, initialInput);

  insertLog({
    level: "info",
    source: "workflow-engine",
    sourceId: workflow.id,
    message: `Starting workflow: ${workflow.name}`,
  });

  const layers = resolveDAG(workflow.steps);

  try {
    for (const layer of layers) {
      // Execute all steps in this layer in parallel
      const results = await Promise.all(
        layer.map((step) => executeStep(step, run, (updated) => {
          updateWorkflowRun(run.id, { stepResults: updated.stepResults, blackboard: updated.blackboard });
        }))
      );

      // Update run with results
      for (const result of results) {
        run.stepResults[result.stepId] = result;
      }
      updateWorkflowRun(run.id, {
        stepResults: run.stepResults,
        blackboard: run.blackboard,
      });

      // Check for errors — retry or abort
      const errors = results.filter((r) => r.status === "error");
      if (errors.length > 0) {
        // Find steps with retries
        for (const errorResult of errors) {
          const step = workflow.steps.find((s) => s.id === errorResult.stepId);
          if (step?.retries && step.retries > 0) {
            // Retry
            insertLog({
              level: "warn",
              source: "workflow-engine",
              sourceId: workflow.id,
              message: `Retrying step ${step.name} (${step.retries} retries left)`,
            });
            const retryStep = { ...step, retries: step.retries - 1 };
            const retryResult = await executeStep(retryStep, run, () => {});
            run.stepResults[retryResult.stepId] = retryResult;
            updateWorkflowRun(run.id, { stepResults: run.stepResults, blackboard: run.blackboard });
          }
        }

        // If any steps still errored, abort
        const stillFailed = Object.values(run.stepResults).filter((r) => r.status === "error");
        if (stillFailed.length > 0) {
          run.status = "error";
          run.error = `Steps failed: ${stillFailed.map((r) => r.stepId).join(", ")}`;
          updateWorkflowRun(run.id, {
            status: "error",
            error: run.error,
            completedAt: new Date().toISOString(),
            stepResults: run.stepResults,
          });

          insertLog({
            level: "error",
            source: "workflow-engine",
            sourceId: workflow.id,
            message: run.error,
          });

          return run;
        }
      }
    }

    // All layers completed successfully
    run.status = "completed";
    updateWorkflowRun(run.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      stepResults: run.stepResults,
      blackboard: run.blackboard,
    });

    insertLog({
      level: "info",
      source: "workflow-engine",
      sourceId: workflow.id,
      message: `Workflow completed: ${workflow.name}`,
    });

    return run;
  } catch (err) {
    run.status = "error";
    run.error = (err as Error).message;
    updateWorkflowRun(run.id, {
      status: "error",
      error: run.error,
      completedAt: new Date().toISOString(),
    });

    insertLog({
      level: "error",
      source: "workflow-engine",
      sourceId: workflow.id,
      message: `Workflow error: ${run.error}`,
    });

    return run;
  }
}
