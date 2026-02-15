"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage as ChatMessageType, ContentBlock, ClaudeEvent } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";

type Platform = "claude-code" | "opencode";

export function ChatPanel({
  initialPrompt,
  cwd,
  systemPrompt,
  sessionId: initialSessionId,
  compact,
  onSessionCreated,
  platform = "claude-code",
}: {
  initialPrompt?: string;
  cwd?: string;
  systemPrompt?: string;
  sessionId?: string;
  compact?: boolean;
  onSessionCreated?: (sessionId: string) => void;
  platform?: Platform;
}) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const [sessionId, setSessionId] = useState(initialSessionId || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialSentRef = useRef(false);

  // Refs to avoid stale closures in callbacks
  const sessionIdRef = useRef(sessionId);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const onSessionCreatedRef = useRef(onSessionCreated);
  useEffect(() => { onSessionCreatedRef.current = onSessionCreated; }, [onSessionCreated]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const processStream = useCallback(
    async (response: Response) => {
      if (!response.ok) {
        console.error("Agent request failed:", response.status, response.statusText);
        setIsStreaming(false);
        isStreamingRef.current = false;
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      // Track the current assistant message being built
      let assistantId = `msg-${Date.now()}`;
      let hasContent = false;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: [],
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]);

      function updateAssistantContent(content: ContentBlock[]) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: [...content] } : m
          )
        );
      }

      function captureSessionId(sid: string | undefined) {
        if (sid && !sessionIdRef.current) {
          setSessionId(sid);
          sessionIdRef.current = sid;
          onSessionCreatedRef.current?.(sid);
        }
      }

      // Normalize SDK content blocks to our ContentBlock type
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
              // Flatten tool_result content to a string
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

              // Capture session_id from any event that carries it
              if ("session_id" in event) captureSessionId(event.session_id);

              if (event.type === "assistant") {
                // SDK sends assistant messages with full content snapshot
                // (with includePartialMessages, each is a progressive snapshot)
                const rawContent = (event.message as Record<string, unknown>)?.content;
                if (Array.isArray(rawContent) && rawContent.length > 0) {
                  const content = normalizeBlocks(rawContent);
                  if (content.length > 0) {
                    hasContent = true;
                    updateAssistantContent(content);
                  }
                }
              } else if (event.type === "user") {
                // Tool results from Claude's tool execution — marks a new turn
                const rawContent = (event.message as Record<string, unknown>)?.content;
                if (Array.isArray(rawContent) && rawContent.length > 0) {
                  const content = normalizeBlocks(rawContent);
                  if (content.length > 0) {
                    // Finalize current assistant message
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId ? { ...m, isStreaming: false } : m
                      )
                    );
                    // Add tool results as an assistant message (so user sees them)
                    const toolResultId = `tool-${Date.now()}`;
                    // Start a new assistant message for the next turn
                    assistantId = `msg-${Date.now() + 1}`;
                    hasContent = false;
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: toolResultId,
                        role: "assistant",
                        content,
                        timestamp: Date.now(),
                        isStreaming: false,
                      },
                      {
                        id: assistantId,
                        role: "assistant",
                        content: [],
                        timestamp: Date.now(),
                        isStreaming: true,
                      },
                    ]);
                  }
                }
              } else if (event.type === "result") {
                captureSessionId(event.session_id);
                // Fallback: if no content was rendered, show result text
                if (!hasContent && event.result) {
                  updateAssistantContent([{ type: "text", text: event.result }]);
                }
              } else if (event.type === "error") {
                const errorText = event.message || "An error occurred";
                updateAssistantContent([
                  { type: "text", text: `**Error:** ${errorText}` },
                ]);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Stream error:", err);
        }
      }

      // Mark streaming complete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
      setIsStreaming(false);
      isStreamingRef.current = false;
    },
    [] // No dependencies — uses refs for mutable state
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreamingRef.current) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: [{ type: "text", text: text.trim() }],
          timestamp: Date.now(),
        },
      ]);

      setIsStreaming(true);
      isStreamingRef.current = true;
      const controller = new AbortController();
      abortRef.current = controller;

      // Route to the correct API based on platform
      const apiBase = platform === "opencode" ? "/api/agent/opencode" : "/api/agent";

      try {
        let response: Response;
        if (sessionIdRef.current) {
          response = await fetch(`${apiBase}/resume`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sessionIdRef.current, message: text.trim() }),
            signal: controller.signal,
          });
        } else {
          response = await fetch(`${apiBase}/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: text.trim(),
              cwd,
              systemPrompt,
              directory: cwd,
            }),
            signal: controller.signal,
          });
        }

        await processStream(response);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Fetch error:", err);
          setIsStreaming(false);
          isStreamingRef.current = false;
        }
      }
    },
    [cwd, systemPrompt, processStream, platform]
  );

  // Stable ref for sendMessage to avoid re-triggering the initial prompt effect
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // Auto-send initial prompt once
  useEffect(() => {
    if (initialPrompt && !initialSentRef.current) {
      initialSentRef.current = true;
      sendMessageRef.current(initialPrompt);
    }
  }, [initialPrompt]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput("");
    sendMessage(text);
  }

  function handleStop() {
    abortRef.current?.abort();
    setIsStreaming(false);
    isStreamingRef.current = false;
  }

  const platformName = platform === "opencode" ? "OpenCode" : "Claude Code";

  return (
    <div className={`flex flex-col ${compact ? "h-full" : "h-full"}`}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                platform === "opencode" ? "bg-emerald-500/10" : "bg-blue-500/10"
              }`}>
                <svg
                  className={`h-6 w-6 ${platform === "opencode" ? "text-emerald-400" : "text-blue-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                {compact
                  ? `${platformName} will build your plugin...`
                  : `Send a message to start a conversation with ${platformName}`}
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStreaming ? `${platformName} is responding...` : "Send a message..."}
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="rounded-lg bg-red-600/20 border border-red-600/30 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          )}
        </form>
        {sessionId && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            Session: {sessionId}
          </p>
        )}
      </div>
    </div>
  );
}
