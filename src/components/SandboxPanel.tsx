"use client";

import { useState, useRef, useEffect } from "react";
import type { SandboxInstance } from "@/lib/types";

export function SandboxPanel({ sandbox }: { sandbox: SandboxInstance }) {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState<{ type: string; data: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(sandbox.status);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [output]);

  async function handleExec() {
    if (!command.trim() || running) return;
    setRunning(true);
    setOutput((prev) => [...prev, { type: "command", data: `$ ${command}` }]);

    try {
      const res = await fetch(`/api/sandboxes/${sandbox.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "done") break;
            setOutput((prev) => [...prev, event]);
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setOutput((prev) => [...prev, { type: "error", data: (err as Error).message }]);
    } finally {
      setRunning(false);
      setCommand("");
    }
  }

  async function handleDestroy() {
    await fetch(`/api/sandboxes/${sandbox.id}`, { method: "DELETE" });
    setStatus("stopped");
  }

  const statusColor =
    status === "running" ? "text-cyan-400" :
    status === "creating" ? "text-amber-400" :
    status === "error" ? "text-red-400" :
    "text-zinc-400";

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${statusColor}`}>
            {status.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {sandbox.sandboxId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {sandbox.config.template} | {sandbox.config.resources.cpu}CPU | {sandbox.config.resources.memoryMB}MB
          </span>
          {status === "running" && (
            <button
              onClick={handleDestroy}
              className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Destroy
            </button>
          )}
        </div>
      </div>

      {/* Output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto bg-zinc-950 p-4 font-mono text-xs space-y-1">
        {output.length === 0 && (
          <p className="text-muted-foreground">Sandbox ready. Enter a command below.</p>
        )}
        {output.map((line, i) => (
          <div key={i} className={
            line.type === "command" ? "text-cyan-400" :
            line.type === "stderr" ? "text-red-400" :
            line.type === "error" ? "text-red-500" :
            "text-zinc-300"
          }>
            {line.data}
          </div>
        ))}
        {running && (
          <div className="text-cyan-400 animate-pulse">Running...</div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleExec(); }}
          className="flex items-center gap-2"
        >
          <span className="text-cyan-400 text-sm font-mono">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command..."
            disabled={running || status !== "running"}
            className="flex-1 bg-transparent text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!command.trim() || running || status !== "running"}
            className="rounded px-3 py-1 text-xs bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 transition-colors"
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
}
