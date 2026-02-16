"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AgentInstanceSummary,
  AgentInstance,
  AgentLogEntry,
  ObservatoryStats,
} from "@/lib/types";

// --- Agents ---

async function fetchAgents(): Promise<AgentInstanceSummary[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

export function useAgentDetail(agentId: string) {
  return useQuery({
    queryKey: ["agent", agentId],
    queryFn: async (): Promise<AgentInstance & { logs: AgentLogEntry[] }> => {
      const res = await fetch(`/api/agents/${agentId}`);
      if (!res.ok) throw new Error("Agent not found");
      return res.json();
    },
    refetchInterval: 10_000,
    staleTime: 3_000,
  });
}

export function useInvalidateAgents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["agents"] });
}

// --- Events (notifications) ---

export interface NotificationEvent {
  id: string;
  type: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

async function fetchEvents(): Promise<NotificationEvent[]> {
  const res = await fetch("/api/events?type=worker.%&limit=10");
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

// --- Observatory ---

async function fetchObservatoryStats(): Promise<ObservatoryStats> {
  const res = await fetch("/api/observatory");
  if (!res.ok) throw new Error("Failed to fetch observatory stats");
  return res.json();
}

export function useObservatoryStats(initialData?: ObservatoryStats) {
  return useQuery({
    queryKey: ["observatory"],
    queryFn: fetchObservatoryStats,
    refetchInterval: 30_000,
    staleTime: 10_000,
    initialData,
  });
}
