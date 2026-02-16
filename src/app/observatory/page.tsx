import { getObservatoryStats } from "@/lib/observatory-stats";
import { ObservatoryDashboard } from "@/components/ObservatoryDashboard";

export const dynamic = "force-dynamic";

export default function ObservatoryPage() {
  const stats = getObservatoryStats();

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Observatory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor agent traces, logs, costs, and health
        </p>
      </div>
      <ObservatoryDashboard initialStats={stats} />
    </div>
  );
}
