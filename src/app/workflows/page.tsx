import { WorkflowBuilder } from "@/components/WorkflowBuilder";

export const dynamic = "force-dynamic";

export default function WorkflowsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create multi-step agent workflows with DAG-based execution, conditions, and retries.
        </p>
      </div>
      <WorkflowBuilder />
    </div>
  );
}
