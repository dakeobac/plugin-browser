"use client";

interface AgentTraceInfo {
  agentId: string;
  agentName: string;
  count: number;
}

export function AgentHealthPanel({ agents }: { agents: AgentTraceInfo[] }) {
  if (agents.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No agent activity recorded yet
      </div>
    );
  }

  const maxCount = Math.max(...agents.map((a) => a.count));

  return (
    <div className="space-y-2">
      {agents.map((agent) => (
        <div key={agent.agentId} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-sm text-foreground truncate">
            {agent.agentName}
          </span>
          <div className="flex-1 h-3 bg-zinc-800 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500/60 rounded"
              style={{ width: `${(agent.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
            {agent.count}
          </span>
        </div>
      ))}
    </div>
  );
}
