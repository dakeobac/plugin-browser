"use client";

import { createContext, useContext, useState, useRef, useCallback } from "react";
import type {
  BackgroundBuild,
  ChatMessage as ChatMessageType,
  ContentBlock,
  ClaudeEvent,
} from "@/lib/types";

interface BuildContextValue {
  builds: BackgroundBuild[];
  startBuild: (opts: {
    pluginName: string;
    pluginPath: string;
    initialPrompt: string;
  }) => void;
  dismissBuild: (id: string) => void;
}

const BuildContext = createContext<BuildContextValue | null>(null);

export function useBuild() {
  const ctx = useContext(BuildContext);
  if (!ctx) throw new Error("useBuild must be used within BuildProvider");
  return ctx;
}

export function BuildProvider({ children }: { children: React.ReactNode }) {
  const [builds, setBuilds] = useState<BackgroundBuild[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  function normalizeBlocks(raw: unknown[]): ContentBlock[] {
    return raw
      .map((block: unknown) => {
        const b = block as Record<string, unknown>;
        if (b.type === "text" && typeof b.text === "string") {
          return { type: "text" as const, text: b.text };
        }
        if (b.type === "tool_use") {
          return {
            type: "tool_use" as const,
            id: (b.id as string) || "",
            name: (b.name as string) || "",
            input: (b.input as Record<string, unknown>) || {},
          };
        }
        if (b.type === "tool_result") {
          let text = "";
          if (typeof b.content === "string") {
            text = b.content;
          } else if (Array.isArray(b.content)) {
            text = (b.content as Record<string, unknown>[])
              .filter((c) => c.type === "text")
              .map((c) => c.text)
              .join("\n");
          }
          return {
            type: "tool_result" as const,
            tool_use_id: (b.tool_use_id as string) || "",
            content: text,
          };
        }
        return null;
      })
      .filter((b): b is ContentBlock => b !== null);
  }

  const startBuild = useCallback(
    ({
      pluginName,
      pluginPath,
      initialPrompt,
    }: {
      pluginName: string;
      pluginPath: string;
      initialPrompt: string;
    }) => {
      const buildId = `build-${Date.now()}`;
      const build: BackgroundBuild = {
        id: buildId,
        pluginName,
        pluginPath,
        status: "building",
        sessionId: null,
        messages: [],
        startedAt: Date.now(),
        completedAt: null,
        error: null,
      };

      setBuilds((prev) => [...prev, build]);

      const controller = new AbortController();
      abortControllers.current.set(buildId, controller);

      // Fire-and-forget async stream processing
      (async () => {
        try {
          const response = await fetch("/api/agent/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: initialPrompt,
              cwd: pluginPath,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            setBuilds((prev) =>
              prev.map((b) =>
                b.id === buildId
                  ? {
                      ...b,
                      status: "error" as const,
                      error: `Request failed: ${response.status}`,
                      completedAt: Date.now(),
                    }
                  : b
              )
            );
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) return;

          const decoder = new TextDecoder();
          let buffer = "";
          let assistantId = `msg-${Date.now()}`;
          let capturedSessionId: string | null = null;
          const allMessages: ChatMessageType[] = [
            {
              id: `user-${Date.now()}`,
              role: "user",
              content: [{ type: "text", text: initialPrompt }],
              timestamp: Date.now(),
            },
            {
              id: assistantId,
              role: "assistant",
              content: [],
              timestamp: Date.now(),
              isStreaming: true,
            },
          ];

          function updateMessages() {
            // Clone messages to trigger re-render
            setBuilds((prev) =>
              prev.map((b) =>
                b.id === buildId
                  ? { ...b, messages: [...allMessages], sessionId: capturedSessionId }
                  : b
              )
            );
          }

          function captureSessionId(sid: string | undefined) {
            if (sid && !capturedSessionId) {
              capturedSessionId = sid;
              // Save session to store
              fetch("/api/agent/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "save",
                  session: {
                    id: sid,
                    title: `Build: ${pluginName}`,
                    createdAt: new Date().toISOString(),
                    lastUsedAt: new Date().toISOString(),
                    pluginContext: pluginName,
                    platform: "claude-code",
                  },
                }),
              }).catch(() => {});
            }
          }

          function getCurrentAssistant() {
            return allMessages.find((m) => m.id === assistantId);
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const json = line.slice(6).trim();
                if (!json) continue;

                try {
                  const event: ClaudeEvent = JSON.parse(json);

                  if (event.type === "done") break;

                  if ("session_id" in event) captureSessionId(event.session_id);

                  if (event.type === "assistant") {
                    const rawContent = (event.message as Record<string, unknown>)?.content;
                    if (Array.isArray(rawContent) && rawContent.length > 0) {
                      const content = normalizeBlocks(rawContent);
                      if (content.length > 0) {
                        const msg = getCurrentAssistant();
                        if (msg) msg.content = content;
                        updateMessages();
                      }
                    }
                  } else if (event.type === "user") {
                    const rawContent = (event.message as Record<string, unknown>)?.content;
                    if (Array.isArray(rawContent) && rawContent.length > 0) {
                      const content = normalizeBlocks(rawContent);
                      if (content.length > 0) {
                        // Finalize current assistant
                        const msg = getCurrentAssistant();
                        if (msg) msg.isStreaming = false;
                        // Add tool results
                        const toolResultId = `tool-${Date.now()}`;
                        allMessages.push({
                          id: toolResultId,
                          role: "assistant",
                          content,
                          timestamp: Date.now(),
                          isStreaming: false,
                        });
                        // New assistant message
                        assistantId = `msg-${Date.now() + 1}`;
                        allMessages.push({
                          id: assistantId,
                          role: "assistant",
                          content: [],
                          timestamp: Date.now(),
                          isStreaming: true,
                        });
                        updateMessages();
                      }
                    }
                  } else if (event.type === "result") {
                    captureSessionId(event.session_id);
                    const msg = getCurrentAssistant();
                    if (msg && msg.content.length === 0 && event.result) {
                      msg.content = [{ type: "text", text: event.result }];
                      updateMessages();
                    }
                  } else if (event.type === "error") {
                    const errorText = event.message || "An error occurred";
                    const msg = getCurrentAssistant();
                    if (msg) {
                      msg.content = [{ type: "text", text: `**Error:** ${errorText}` }];
                      updateMessages();
                    }
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          } catch (err) {
            if ((err as Error).name !== "AbortError") {
              console.error("Build stream error:", err);
            }
          }

          // Finalize last assistant message
          const lastMsg = getCurrentAssistant();
          if (lastMsg) lastMsg.isStreaming = false;

          // Mark build done
          setBuilds((prev) =>
            prev.map((b) =>
              b.id === buildId
                ? {
                    ...b,
                    status: "done" as const,
                    completedAt: Date.now(),
                    messages: [...allMessages],
                    sessionId: capturedSessionId,
                  }
                : b
            )
          );
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            setBuilds((prev) =>
              prev.map((b) =>
                b.id === buildId
                  ? {
                      ...b,
                      status: "error" as const,
                      error: (err as Error).message,
                      completedAt: Date.now(),
                    }
                  : b
              )
            );
          }
        } finally {
          abortControllers.current.delete(buildId);
        }
      })();
    },
    []
  );

  const dismissBuild = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    setBuilds((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <BuildContext.Provider value={{ builds, startBuild, dismissBuild }}>
      {children}
    </BuildContext.Provider>
  );
}
