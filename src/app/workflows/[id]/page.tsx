import { WorkflowBuilder } from "@/components/WorkflowBuilder";

export const dynamic = "force-dynamic";

export default function WorkflowDetailPage() {
  // The WorkflowBuilder handles selection internally.
  // This page exists for direct linking — could be enhanced with
  // pre-selecting the workflow ID from params.
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create multi-step agent workflows with DAG-based execution.
        </p>
      </div>
      <WorkflowBuilder />
    </div>
  );
}
