import type { PluginSummary } from "./types";
import type {
  PluginFingerprint,
  CommandPattern,
  StructuralPattern,
  DomainGroup,
  PatternAnalysis,
} from "./types";
import { loadPluginDetail } from "./plugin-parser";

// --- Phase 1: Build fingerprints ---

function extractDomain(name: string): string | undefined {
  // e.g. "glintlock-seo" → "glintlock", "glintlock-ip" → "glintlock"
  // Only extract if the prefix appears in multiple plugin names
  const parts = name.split("-");
  if (parts.length >= 2) {
    return parts[0];
  }
  return undefined;
}

export function buildFingerprints(plugins: PluginSummary[]): PluginFingerprint[] {
  // Deduplicate by plugin name — same plugin in multiple marketplaces should only count once
  const seen = new Set<string>();
  const results: PluginFingerprint[] = [];

  for (const p of plugins) {
    if (seen.has(p.name)) continue;
    seen.add(p.name);

    const detail = loadPluginDetail(p);
    results.push({
      name: p.name,
      marketplace: p.marketplace,
      slug: p.slug,
      commandNames: detail.commands.map((c) => c.replace(/\.md$/, "")),
      skillNames: detail.skills,
      agentNames: detail.agents.map((a) => a.replace(/\.md$/, "")),
      hasMcp: p.hasMcp,
      hasHooks: p.hasHooks,
      domain: extractDomain(p.name),
    });
  }

  return results;
}

// --- Phase 2: Detect command patterns ---

interface PatternRule {
  pattern: string;
  description: string;
  test: (cmd: string) => boolean;
}

const COMMAND_PATTERNS: PatternRule[] = [
  {
    pattern: "audit",
    description: "Audit/checklist commands for compliance or quality checks",
    test: (cmd) => /audit|check|scan|lint|validate/i.test(cmd),
  },
  {
    pattern: "scaffold",
    description: "Scaffolding commands that create new files or structures",
    test: (cmd) => /^(new-|add-|create-|init|setup-|scaffold)/i.test(cmd),
  },
  {
    pattern: "content",
    description: "Content management and publishing commands",
    test: (cmd) => /publish|draft|content|post|calendar/i.test(cmd),
  },
  {
    pattern: "connect",
    description: "Integration and connection commands",
    test: (cmd) => /connect|setup|config|integrate/i.test(cmd),
  },
  {
    pattern: "analytics",
    description: "Analytics and reporting commands",
    test: (cmd) => /traffic|analytics|report|stats|metric/i.test(cmd),
  },
];

function detectCommandPatterns(
  fingerprints: PluginFingerprint[]
): CommandPattern[] {
  const patterns: CommandPattern[] = [];

  for (const rule of COMMAND_PATTERNS) {
    const pluginsWithPattern: string[] = [];
    const matchedCmds: string[] = [];

    for (const fp of fingerprints) {
      const matches = fp.commandNames.filter(rule.test);
      if (matches.length > 0) {
        pluginsWithPattern.push(fp.name);
        matchedCmds.push(...matches);
      }
    }

    if (pluginsWithPattern.length >= 2) {
      patterns.push({
        pattern: rule.pattern,
        description: rule.description,
        plugins: pluginsWithPattern,
        matchedCommands: [...new Set(matchedCmds)],
      });
    }
  }

  return patterns;
}

// --- Phase 3: Detect structural patterns ---

function detectStructuralPatterns(
  fingerprints: PluginFingerprint[]
): StructuralPattern[] {
  const patterns: StructuralPattern[] = [];

  // Audit-checklist: plugins with audit-like commands
  const auditPlugins = fingerprints.filter((fp) =>
    fp.commandNames.some((c) => /audit|check|scan|lint|validate/i.test(c))
  );
  if (auditPlugins.length >= 2) {
    patterns.push({
      id: "audit-checklist",
      name: "Audit Checklist",
      description:
        "Plugins that implement checklist-based auditing with structured pass/fail results",
      plugins: auditPlugins.map((p) => p.name),
      pluginSlugs: auditPlugins.map((p) => p.slug),
    });
  }

  // Scaffold-commands: plugins with scaffolding commands
  const scaffoldPlugins = fingerprints.filter((fp) =>
    fp.commandNames.some((c) =>
      /^(new-|add-|create-|init|setup-|scaffold)/i.test(c)
    )
  );
  if (scaffoldPlugins.length >= 2) {
    patterns.push({
      id: "scaffold-commands",
      name: "Scaffold Commands",
      description:
        "Plugins that generate new files, components, or project structures from templates",
      plugins: scaffoldPlugins.map((p) => p.name),
      pluginSlugs: scaffoldPlugins.map((p) => p.slug),
    });
  }

  // MCP-wrapper: plugins with MCP servers
  const mcpPlugins = fingerprints.filter((fp) => fp.hasMcp);
  if (mcpPlugins.length >= 2) {
    patterns.push({
      id: "mcp-wrapper",
      name: "MCP API Wrapper",
      description:
        "Plugins that wrap external APIs or services through MCP servers",
      plugins: mcpPlugins.map((p) => p.name),
      pluginSlugs: mcpPlugins.map((p) => p.slug),
    });
  }

  // Hooks-session: plugins with hooks
  const hookPlugins = fingerprints.filter((fp) => fp.hasHooks);
  if (hookPlugins.length >= 2) {
    patterns.push({
      id: "hooks-session",
      name: "Session Hooks",
      description:
        "Plugins that use hooks for session lifecycle management, validation, or automation",
      plugins: hookPlugins.map((p) => p.name),
      pluginSlugs: hookPlugins.map((p) => p.slug),
    });
  }

  // Markdown-state: plugins with skills (skills often use markdown state files)
  const skillPlugins = fingerprints.filter(
    (fp) => fp.skillNames.length >= 2
  );
  if (skillPlugins.length >= 2) {
    patterns.push({
      id: "markdown-state",
      name: "Markdown State",
      description:
        "Plugins that use markdown files as state storage for workflows, journals, or checklists",
      plugins: skillPlugins.map((p) => p.name),
      pluginSlugs: skillPlugins.map((p) => p.slug),
    });
  }

  return patterns;
}

// --- Phase 4: Domain grouping ---

function detectDomainGroups(fingerprints: PluginFingerprint[]): DomainGroup[] {
  const domainMap = new Map<string, PluginFingerprint[]>();

  for (const fp of fingerprints) {
    if (fp.domain) {
      const existing = domainMap.get(fp.domain) || [];
      existing.push(fp);
      domainMap.set(fp.domain, existing);
    }
  }

  const groups: DomainGroup[] = [];
  for (const [domain, fps] of domainMap) {
    if (fps.length >= 2) {
      groups.push({
        domain,
        plugins: fps.map((fp) => fp.name),
        pluginSlugs: fps.map((fp) => fp.slug),
      });
    }
  }

  // Sort by size descending
  groups.sort((a, b) => b.plugins.length - a.plugins.length);

  return groups;
}

// --- Main entry point ---

export function analyzePatterns(plugins: PluginSummary[]): PatternAnalysis {
  const fingerprints = buildFingerprints(plugins);
  const commandPatterns = detectCommandPatterns(fingerprints);
  const structuralPatterns = detectStructuralPatterns(fingerprints);
  const domainGroups = detectDomainGroups(fingerprints);

  return {
    commandPatterns,
    structuralPatterns,
    domainGroups,
  };
}
