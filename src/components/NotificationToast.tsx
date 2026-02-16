"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useNotifications, type Notification } from "./NotificationProvider";

const AUTO_DISMISS_MS = 15_000;

function Toast({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  const isSuccess = notification.type === "success";
  const dotColor = isSuccess ? "bg-green-500" : "bg-red-500";
  const statusText = isSuccess ? "Completed" : "Failed";
  const statusColor = isSuccess ? "text-green-400" : "text-red-400";

  const timeAgo = formatTimeAgo(notification.timestamp);

  return (
    <div
      className="rounded-xl border border-border bg-popover/95 backdrop-blur shadow-2xl shadow-black/30 p-4 space-y-2"
      style={{ animation: "slide-up-in 0.3s ease-out" }}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {notification.title}
          </p>
          <p className={`text-xs ${statusColor}`}>{statusText}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <button
            onClick={onDismiss}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {notification.message && (
        <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
          {notification.message}
        </p>
      )}
      {notification.agentId && (
        <div className="pl-5">
          <Link
            href={`/agents/${notification.agentId}`}
            className="inline-block rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            Review
          </Link>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function NotificationToast() {
  const { notifications, dismissNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 space-y-2">
      {notifications.slice(-5).map((notif) => (
        <Toast
          key={notif.id}
          notification={notif}
          onDismiss={() => dismissNotification(notif.id)}
        />
      ))}
    </div>
  );
}
