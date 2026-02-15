import { NextRequest } from "next/server";
import { createOpenCodeSession, streamOpenCodePrompt } from "@/lib/opencode-process";
import type { AiPattern, AiSuggestion } from "@/lib/types";

export const dynamic = "force-dynamic";

const ANALYSIS_PROMPT_TEMPLATE = `Analyze these Claude Code and OpenCode plugins for patterns and suggest new plugins.

## Plugins
{PLUGIN_DATA}

Respond ONLY with valid JSON matching this exact schema (no markdown fencing, no explanation):
{
  "patterns": [
    {
      "name": "string - pattern name",
      "description": "string - what this pattern represents",
      "plugins": ["string - plugin names that share this pattern"],
      "type": "command | structural | domain"
    }
  ],
  "suggestions": [
    {
      "title": "string - suggested plugin title",
      "description": "string - what this plugin would do",
      "rationale": "string - why this plugin would be useful based on the patterns",
      "priority": "high | medium | low",
      "suggestedName": "string - kebab-case plugin name",
      "suggestedCommands": ["string - suggested slash command names"],
      "suggestedSkills": ["string - suggested skill names"],
      "platform": "claude-code | opencode | both"
    }
  ]
}

Look for:
- Common command naming patterns (audit, check, new, add, etc.)
- Structural patterns (plugins that all use MCP, hooks, agents, etc.)
- Domain groupings (plugins that share a common topic like SEO, blog, etc.)
- Gaps: what plugins are missing that would complement the existing ecosystem?
- Cross-platform opportunities: patterns from one platform that could work on the other`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { plugins } = body;

  if (!Array.isArray(plugins) || plugins.length === 0) {
    return new Response(JSON.stringify({ error: "plugins array is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pluginData = plugins
    .map(
      (p: { name: string; commandNames?: string[]; skillNames?: string[]; agentNames?: string[]; hasMcp?: boolean; hasHooks?: boolean; marketplace?: string; domain?: string }) =>
        `- ${p.name} (${p.marketplace || "unknown"}): commands=[${(p.commandNames || []).join(", ")}] skills=[${(p.skillNames || []).join(", ")}] agents=[${(p.agentNames || []).join(", ")}] mcp=${p.hasMcp} hooks=${p.hasHooks} domain=${p.domain || "none"}`
    )
    .join("\n");

  const prompt = ANALYSIS_PROMPT_TEMPLATE.replace("{PLUGIN_DATA}", pluginData);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      function send(data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* stream closed */
        }
      }

      send({ type: "status", message: "Starting AI analysis..." });

      (async () => {
        try {
          const cwd = process.cwd();
          const { sessionID } = await createOpenCodeSession(cwd, "Plugin Analysis");

          // Accumulate text from the response
          let fullText = "";

          await streamOpenCodePrompt(sessionID, cwd, prompt, (event) => {
            if (event.type === "assistant" && "message" in event && event.message) {
              const content = event.message.content;
              if (Array.isArray(content)) {
                for (const block of content) {
                  if (block.type === "text") {
                    fullText = block.text;
                  }
                }
              }
            }

            if (event.type === "done") {
              // Parse the accumulated text as JSON
              try {
                // Strip markdown code fences if present
                let jsonStr = fullText.trim();
                if (jsonStr.startsWith("```")) {
                  jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
                }

                const parsed = JSON.parse(jsonStr) as {
                  patterns?: AiPattern[];
                  suggestions?: AiSuggestion[];
                };
                send({
                  type: "result",
                  patterns: parsed.patterns || [],
                  suggestions: parsed.suggestions || [],
                });
              } catch {
                send({
                  type: "result",
                  patterns: [],
                  suggestions: [],
                  parseError: "Failed to parse AI response as JSON",
                  rawText: fullText.slice(0, 2000),
                });
              }
            }
          });
        } catch (err) {
          console.error("[AI Analysis] Error:", err);
          send({ type: "error", message: (err as Error).message });
        } finally {
          send({ type: "done" });
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
