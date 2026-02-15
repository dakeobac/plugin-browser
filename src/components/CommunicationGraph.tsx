"use client";

import type { BusEvent, Team } from "@/lib/types";

/**
 * Simple communication graph visualization.
 * Shows agents as nodes and events as edges (using pure SVG).
 */
export function CommunicationGraph({
  team,
  events,
}: {
  team: Team;
  events: BusEvent[];
}) {
  const members = team.members;
  const nodeCount = members.length;

  if (nodeCount === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No team members to visualize
      </div>
    );
  }

  // Arrange nodes in a circle
  const cx = 200;
  const cy = 150;
  const radius = Math.min(120, 40 + nodeCount * 20);

  const nodes = members.map((m, i) => {
    const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
    return {
      id: m.agentId,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      role: m.role,
      isSupervisor: m.agentId === team.supervisorId,
    };
  });

  // Build edges from events
  const edges: { from: string; to: string; type: string }[] = [];
  for (const evt of events) {
    if (evt.type === "task.delegated" && evt.payload.agentId) {
      edges.push({
        from: evt.source.replace("team:", ""),
        to: evt.payload.agentId as string,
        type: "delegation",
      });
    } else if (evt.type === "task.completed") {
      edges.push({
        from: evt.source,
        to: team.supervisorId || "",
        type: "completion",
      });
    }
  }

  // Deduplicate edges
  const edgeSet = new Set<string>();
  const uniqueEdges = edges.filter((e) => {
    const key = `${e.from}-${e.to}-${e.type}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    return true;
  });

  function getNodePos(id: string) {
    return nodes.find((n) => n.id === id) || { x: cx, y: cy };
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-medium text-foreground mb-2">Communication Graph</h4>
      <svg viewBox="0 0 400 300" className="w-full h-auto max-h-64">
        {/* Edges */}
        {uniqueEdges.map((edge, i) => {
          const from = getNodePos(edge.from);
          const to = getNodePos(edge.to);
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.type === "delegation" ? "#3b82f6" : "#22c55e"}
              strokeWidth={1.5}
              strokeDasharray={edge.type === "delegation" ? "none" : "4,4"}
              opacity={0.5}
              markerEnd="url(#arrow)"
            />
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
          </marker>
        </defs>

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.isSupervisor ? 20 : 16}
              fill={node.isSupervisor ? "#f59e0b20" : "#3b82f620"}
              stroke={node.isSupervisor ? "#f59e0b" : "#3b82f6"}
              strokeWidth={1.5}
            />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              className="text-[10px] fill-current text-foreground"
            >
              {node.role.slice(0, 3).toUpperCase()}
            </text>
            <text
              x={node.x}
              y={node.y + (node.isSupervisor ? 34 : 30)}
              textAnchor="middle"
              className="text-[8px] fill-current text-muted-foreground"
            >
              {node.id.slice(0, 12)}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-4 bg-blue-500" />
          <span>Delegation</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-4 bg-green-500 border-dashed" style={{ borderStyle: "dashed" }} />
          <span>Completion</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full border border-amber-500" />
          <span>Supervisor</span>
        </div>
      </div>
    </div>
  );
}
