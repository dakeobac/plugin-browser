import type { ParsedBriefSpec } from "./types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  design: ["design", "token", "typography", "color", "font", "spacing", "layout", "css", "tailwind", "ui", "aesthetic"],
  development: ["api", "sdk", "framework", "build", "compile", "bundle", "webpack", "vite"],
  security: ["security", "auth", "encrypt", "vulnerability", "pentest", "audit"],
  testing: ["test", "spec", "jest", "cypress", "coverage", "e2e"],
  productivity: ["workflow", "automate", "productivity", "template", "scaffold"],
  database: ["database", "sql", "postgres", "mongo", "redis", "migration"],
  monitoring: ["monitor", "log", "metric", "alert", "observability"],
  deployment: ["deploy", "ci/cd", "docker", "kubernetes", "infrastructure"],
  learning: ["learn", "tutorial", "guide", "documentation", "wiki"],
  entertainment: ["game", "music", "art", "creative"],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractName(text: string): { name: string; displayName: string } {
  // Try **Name:** field
  const nameField = text.match(/\*\*Name:\*\*\s*(.+)/);
  if (nameField) {
    const display = nameField[1].trim();
    return { name: slugify(display), displayName: display };
  }

  // Try # Title heading (first H1)
  const h1 = text.match(/^#\s+(.+?)(?:\s*[-—]|$)/m);
  if (h1) {
    const display = h1[1].trim();
    return { name: slugify(display), displayName: display };
  }

  // Try ## Name heading
  const h2Name = text.match(/^##\s+(?:Name|Title|Plugin)\s*[:—-]?\s*(.+)/mi);
  if (h2Name) {
    const display = h2Name[1].trim();
    return { name: slugify(display), displayName: display };
  }

  return { name: "", displayName: "" };
}

function extractDescription(text: string): string {
  // Try first blockquote after title
  const blockquote = text.match(/^>\s*(.+(?:\n>\s*.+)*)/m);
  if (blockquote) {
    return blockquote[1]
      .replace(/^>\s*/gm, "")
      .replace(/\n/g, " ")
      .trim()
      .slice(0, 200);
  }

  // Try first paragraph after any heading
  const afterHeading = text.match(/^#+\s+.+\n+([^#\n>|].+)/m);
  if (afterHeading) {
    return afterHeading[1].trim().slice(0, 200);
  }

  return "";
}

function extractCommands(text: string): string[] {
  const commands = new Set<string>();

  // Match /command-name patterns
  const slashCommands = text.matchAll(/`\/([a-z][a-z0-9-]+)`/g);
  for (const m of slashCommands) {
    commands.add(m[1]);
  }

  // Look for ## Commands section or "command" in section headers
  const commandSection = text.match(/^##\s+.*?command.*?\n([\s\S]*?)(?=^##\s|\Z)/mi);
  if (commandSection) {
    // Extract backticked names in bullet items
    const bullets = commandSection[1].matchAll(/[-*]\s+.*?`([a-z][a-z0-9-]+)`/g);
    for (const b of bullets) {
      commands.add(b[1]);
    }
  }

  // "What the Plugin Should Provide" section — look for command patterns
  const provideSection = text.match(/what the plugin should provide[\s\S]*?(?=^---|\Z)/mi);
  if (provideSection) {
    const cmdMatches = provideSection[0].matchAll(/`([a-z][a-z0-9-]+)`\s*command/gi);
    for (const m of cmdMatches) {
      commands.add(m[1]);
    }
    // Also match "A `name` command" pattern
    const cmdMatches2 = provideSection[0].matchAll(/\*\*.*?`([a-z][a-z0-9-]+)`.*?command\*\*/gi);
    for (const m of cmdMatches2) {
      commands.add(m[1]);
    }
  }

  return [...commands];
}

function extractSkills(text: string): string[] {
  const skills = new Set<string>();

  // Look for ## Skills section
  const skillSection = text.match(/^##\s+.*?skill.*?\n([\s\S]*?)(?=^##\s|\Z)/mi);
  if (skillSection) {
    const bullets = skillSection[1].matchAll(/[-*]\s+.*?`([a-z][a-z0-9-]+)`/g);
    for (const b of bullets) {
      skills.add(b[1]);
    }
  }

  // "What the Plugin Should Provide" section — look for skill patterns
  const provideSection = text.match(/what the plugin should provide[\s\S]*?(?=^---|\Z)/mi);
  if (provideSection) {
    const skillMatches = provideSection[0].matchAll(/`([a-z][a-z0-9-]+)`\s*skill/gi);
    for (const m of skillMatches) {
      skills.add(m[1]);
    }
    // Also match "A `name` skill" or "**A `name` skill**"
    const skillMatches2 = provideSection[0].matchAll(/\*\*.*?`([a-z][a-z0-9-]+)`.*?skill\*\*/gi);
    for (const m of skillMatches2) {
      skills.add(m[1]);
    }
  }

  return [...skills];
}

function extractAgents(text: string): string[] {
  const agents = new Set<string>();

  const agentSection = text.match(/^##\s+.*?agent.*?\n([\s\S]*?)(?=^##\s|\Z)/mi);
  if (agentSection) {
    const bullets = agentSection[1].matchAll(/[-*]\s+.*?`([a-z][a-z0-9-]+)`/g);
    for (const b of bullets) {
      agents.add(b[1]);
    }
  }

  return [...agents];
}

function detectMcp(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("mcp server") ||
    lower.includes("model context protocol") ||
    lower.includes(".mcp.json") ||
    /\bmcp\b/.test(lower)
  );
}

function detectHooks(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("pre-tool") ||
    lower.includes("post-tool") ||
    lower.includes("pretooluse") ||
    lower.includes("posttooluse") ||
    lower.includes("hooks.json") ||
    /\bhook[s]?\b/.test(lower)
  );
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      const matches = lower.match(regex);
      if (matches) {
        scores[category] += matches.length;
      }
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : "";
}

function buildSummary(spec: Partial<ParsedBriefSpec>): string {
  const parts: string[] = [];
  if (spec.name) parts.push(spec.name);
  if (spec.commands && spec.commands.length > 0)
    parts.push(`${spec.commands.length} command${spec.commands.length > 1 ? "s" : ""}`);
  if (spec.skills && spec.skills.length > 0)
    parts.push(`${spec.skills.length} skill${spec.skills.length > 1 ? "s" : ""}`);
  if (spec.agents && spec.agents.length > 0)
    parts.push(`${spec.agents.length} agent${spec.agents.length > 1 ? "s" : ""}`);
  if (spec.hasMcp) parts.push("MCP");
  if (spec.hasHooks) parts.push("hooks");
  return parts.length > 0 ? `Extracted: ${parts.join(", ")}` : "No features extracted";
}

function computeConfidence(spec: Partial<ParsedBriefSpec>): "high" | "medium" | "low" {
  let score = 0;
  if (spec.name) score += 2;
  if (spec.description) score += 1;
  if (spec.category) score += 1;
  if (spec.commands && spec.commands.length > 0) score += 2;
  if (spec.skills && spec.skills.length > 0) score += 2;
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export function extractSpecFromBrief(text: string): ParsedBriefSpec {
  const { name, displayName } = extractName(text);
  const description = extractDescription(text);
  const commands = extractCommands(text);
  const skills = extractSkills(text);
  const agents = extractAgents(text);
  const hasMcp = detectMcp(text);
  const hasHooks = detectHooks(text);
  const category = detectCategory(text);

  const partial: Partial<ParsedBriefSpec> = {
    name,
    displayName,
    description,
    category,
    commands,
    skills,
    agents,
    hasMcp,
    hasHooks,
  };

  const summary = buildSummary(partial);
  const confidence = computeConfidence(partial);

  return {
    name: name || "",
    displayName: displayName || "",
    description: description || "",
    category: category || "",
    commands: commands || [],
    skills: skills || [],
    agents: agents || [],
    hasMcp: hasMcp || false,
    hasHooks: hasHooks || false,
    summary,
    confidence,
  };
}
