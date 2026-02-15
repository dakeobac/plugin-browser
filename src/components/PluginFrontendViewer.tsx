"use client";

import Link from "next/link";

export function PluginFrontendViewer({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const src = `/api/plugin-frontend/${encodeURIComponent(slug)}`;

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 shrink-0">
        <Link
          href="/home"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <span className="text-sm font-medium text-foreground">{name}</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground transition-colors hover:text-accent-foreground"
        >
          Open in new tab
        </a>
      </div>

      {/* Iframe */}
      <iframe
        src={src}
        className="flex-1 w-full border-none bg-white"
        title={`${name} Dashboard`}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
