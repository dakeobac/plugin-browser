import { NextRequest } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { ChatMessage, ContentBlock } from "@/lib/types";

export const dynamic = "force-dynamic";

function findSessionJsonl(sessionId: string): string | null {
  const projectsDir = join(homedir(), ".claude", "projects");
  if (!existsSync(projectsDir)) return null;

  const filename = `${sessionId}.jsonl`;

  // Check the known project directory first
  const knownDir = join(projectsDir, "-Users-dakeobac-Coding-plugin-browser");
  const knownPath = join(knownDir, filename);
  if (existsSync(knownPath)) return knownPath;

  // Fallback: scan all project directories
  try {
    const dirs = readdirSync(projectsDir, { withFileTypes: true });
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;
      const candidate = join(projectsDir, dir.name, filename);
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    // ignore
  }

  return null;
}

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const filePath = findSessionJsonl(sessionId);

  if (!filePath) {
    return Response.json([]);
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim());

    const messages: ChatMessage[] = [];
    // Track assistant messages by their SDK message ID to deduplicate progressive snapshots
    const assistantById = new Map<string, number>(); // message.id -> index in messages array

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        const type = obj.type;
        const msg = obj.message;

        if (!msg || typeof msg !== "object") continue;
        if (type !== "user" && type !== "assistant") continue;

        const rawContent = msg.content;
        if (!rawContent) continue;

        // User messages
        if (type === "user" && msg.role === "user") {
          // content can be a string or array
          let content: ContentBlock[];
          if (typeof rawContent === "string") {
            content = [{ type: "text", text: rawContent }];
          } else if (Array.isArray(rawContent)) {
            content = normalizeBlocks(rawContent);
          } else {
            continue;
          }

          // Skip empty or tool-result-only user messages (tool execution turn boundaries)
          const hasText = content.some((b) => b.type === "text" && b.text.trim());
          if (!hasText) continue;

          messages.push({
            id: `user-${messages.length}`,
            role: "user",
            content,
            timestamp: Date.now(),
          });
          continue;
        }

        // Assistant messages — deduplicate by message.id (keep last snapshot)
        if (type === "assistant" && msg.role === "assistant") {
          const msgId = msg.id as string;
          if (!msgId) continue;

          const content = Array.isArray(rawContent) ? normalizeBlocks(rawContent) : [];
          if (content.length === 0) continue;

          const existing = assistantById.get(msgId);
          const chatMsg: ChatMessage = {
            id: msgId,
            role: "assistant",
            content,
            timestamp: Date.now(),
          };

          if (existing !== undefined) {
            // Replace with later (more complete) snapshot
            messages[existing] = chatMsg;
          } else {
            assistantById.set(msgId, messages.length);
            messages.push(chatMsg);
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    return Response.json(messages);
  } catch {
    return Response.json([]);
  }
}
