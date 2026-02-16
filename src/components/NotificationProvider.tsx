"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useEvents, type NotificationEvent } from "@/hooks/use-queries";

export interface Notification {
  id: string;
  type: "success" | "error";
  title: string;
  message: string;
  agentId?: string;
  timestamp: string;
}

interface NotificationContextValue {
  notifications: Notification[];
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const seenIds = useRef(new Set<string>());
  const { data: events } = useEvents();

  useEffect(() => {
    if (!events) return;

    const newNotifs: Notification[] = [];
    for (const event of events) {
      if (seenIds.current.has(event.id)) continue;
      seenIds.current.add(event.id);

      const isSuccess = event.type === "worker.completed";
      const payload = event.payload || {};

      newNotifs.push({
        id: event.id,
        type: isSuccess ? "success" : "error",
        title: isSuccess
          ? `${payload.name || "Worker"} completed`
          : `${payload.name || "Worker"} failed`,
        message: isSuccess
          ? ((payload.output as string) || "Task completed successfully").slice(0, 200)
          : ((payload.error as string) || "An error occurred"),
        agentId: payload.agentId as string | undefined,
        timestamp: event.timestamp,
      });

      // Consume the event so it doesn't show up again
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      }).catch(() => {});
    }

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...prev, ...newNotifs]);
    }
  }, [events]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, dismissNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
