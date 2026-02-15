"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Markdown from "react-markdown";
import type { WikiTopic } from "@/lib/wiki-content";

export function WikiView({
  topics,
  currentTopic,
}: {
  topics: { slug: string; title: string; category: string }[];
  currentTopic: WikiTopic;
}) {
  const pathname = usePathname();

  // Group topics by category
  const categories = new Map<string, typeof topics>();
  for (const t of topics) {
    const group = categories.get(t.category) || [];
    group.push(t);
    categories.set(t.category, group);
  }

  return (
    <div className="flex gap-8">
      {/* Desktop Sidebar */}
      <nav className="hidden md:block w-64 shrink-0">
        <div className="sticky top-24 space-y-6">
          {Array.from(categories.entries()).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </h3>
              <ul className="space-y-1">
                {items.map((t) => {
                  const isActive = pathname === `/wiki/${t.slug}`;
                  return (
                    <li key={t.slug}>
                      <Link
                        href={`/wiki/${t.slug}`}
                        className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                          isActive
                            ? "bg-primary/20 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {t.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile topic bar */}
      <div className="md:hidden fixed top-[73px] left-0 right-0 z-10 border-b border-border bg-background/90 backdrop-blur-sm px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {topics.map((t) => {
            const isActive = pathname === `/wiki/${t.slug}`;
            return (
              <Link
                key={t.slug}
                href={`/wiki/${t.slug}`}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {t.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 md:pt-0 pt-12">
        <div className="prose-theme max-w-none">
          <Markdown>{currentTopic.content}</Markdown>
        </div>
      </div>
    </div>
  );
}
