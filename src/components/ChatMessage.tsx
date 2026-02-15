"use client";

import Markdown from "react-markdown";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { ToolUseBlock } from "./ToolUseBlock";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-blue-600/20 border border-blue-500/20 px-4 py-2.5">
          {message.content.map((block, i) =>
            block.type === "text" ? (
              <p key={i} className="text-sm text-foreground whitespace-pre-wrap">
                {block.text}
              </p>
            ) : null
          )}
        </div>
      </div>
    );
  }

  // Show thinking indicator while waiting for first content chunk
  if (message.isStreaming && message.content.length === 0) {
    return (
      <div className="flex justify-start">
        <div className="flex items-center gap-1 px-3 py-2 text-muted-foreground">
          <span className="animate-pulse">●</span>
          <span className="animate-pulse [animation-delay:150ms]">●</span>
          <span className="animate-pulse [animation-delay:300ms]">●</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-1">
        {message.content.map((block, i) => {
          if (block.type === "text") {
            return (
              <div
                key={i}
                className={`prose-theme text-sm text-foreground ${
                  message.isStreaming ? "streaming-cursor" : ""
                }`}
              >
                <Markdown>{block.text}</Markdown>
              </div>
            );
          }
          if (block.type === "tool_use") {
            return (
              <ToolUseBlock
                key={i}
                name={block.name}
                input={block.input}
              />
            );
          }
          if (block.type === "tool_result") {
            return (
              <div
                key={i}
                className="my-1 rounded-lg border border-border bg-card/30 px-3 py-2 text-xs text-muted-foreground max-h-24 overflow-y-auto"
              >
                <pre className="whitespace-pre-wrap">{block.content.slice(0, 500)}</pre>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
