"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface StatCardProps {
  value: number;
  label: string;
  href: string;
  color: string; // tailwind text color class e.g. "text-emerald-400"
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function AnimatedValue({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;
    if (from === to) {
      setDisplay(to);
      return;
    }

    const duration = 500;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return <>{formatNumber(display)}</>;
}

function StatCard({ value, label, href, color }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/80"
    >
      <div className={`text-2xl font-bold ${color} ${value === 0 ? "opacity-40" : ""}`}>
        <AnimatedValue value={value} />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Link>
  );
}

interface StatStripProps {
  agentsRunning: number;
  teamsActive: number;
  pluginsInstalled: number;
  tokensToday: number;
}

export function StatStrip({
  agentsRunning,
  teamsActive,
  pluginsInstalled,
  tokensToday,
}: StatStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        value={agentsRunning}
        label="Agents Running"
        href="/agents"
        color="text-emerald-400"
      />
      <StatCard
        value={teamsActive}
        label="Teams Active"
        href="/teams"
        color="text-blue-400"
      />
      <StatCard
        value={pluginsInstalled}
        label="Plugins Installed"
        href="/plugins"
        color="text-orange-400"
      />
      <StatCard
        value={tokensToday}
        label="Tokens Today"
        href="/observatory"
        color="text-orange-400"
      />
    </div>
  );
}
