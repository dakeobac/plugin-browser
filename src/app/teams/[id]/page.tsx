import { TeamDashboard } from "@/components/TeamDashboard";

export const dynamic = "force-dynamic";

export default function TeamDetailPage() {
  // The TeamDashboard handles selection internally.
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Teams</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-agent team coordination.
        </p>
      </div>
      <TeamDashboard />
    </div>
  );
}
