"use client";

import type { CostSummary } from "@/lib/types";

export function CostBreakdown({ costs }: { costs: CostSummary[] }) {
  if (costs.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No cost data yet
      </div>
    );
  }

  // Aggregate by date
  const byDate = new Map<string, number>();
  for (const cost of costs) {
    byDate.set(cost.date, (byDate.get(cost.date) || 0) + cost.totalCost);
  }

  const entries = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const maxCost = Math.max(...entries.map(([, v]) => v), 0.001);

  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <div className="flex items-end gap-1 h-32">
        {entries.map(([date, cost]) => (
          <div key={date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end h-24">
              <div
                className="w-full bg-blue-500/40 rounded-t"
                style={{ height: `${(cost / maxCost) * 100}%`, minHeight: 2 }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">
              {date.slice(5)}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{entries.length} days</span>
        <span>
          Total: ${entries.reduce((sum, [, v]) => sum + v, 0).toFixed(4)}
        </span>
      </div>
    </div>
  );
}
