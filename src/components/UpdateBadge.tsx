"use client";

import type { UpdateInfo } from "@/lib/types";

export function UpdateBadge({ updateInfo }: { updateInfo?: UpdateInfo }) {
  if (!updateInfo?.hasUpdate) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      Update
    </span>
  );
}
