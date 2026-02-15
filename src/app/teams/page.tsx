import { TeamDashboard } from "@/components/TeamDashboard";

export const dynamic = "force-dynamic";

export default function TeamsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Teams</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize agents into teams with supervisors, shared blackboard, and event-driven coordination.
        </p>
      </div>
      <TeamDashboard />
    </div>
  );
}
