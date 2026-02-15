import type {
  PatternAnalysis,
  PluginSummary,
  PluginSuggestion,
} from "./types";

let nextId = 1;
function makeId(): string {
  return `suggestion-${nextId++}`;
}

// Rule 1: Pattern extraction — 3+ plugins share a command pattern → shared framework
function suggestPatternExtraction(
  analysis: PatternAnalysis
): PluginSuggestion[] {
  const suggestions: PluginSuggestion[] = [];

  for (const cp of analysis.commandPatterns) {
    if (cp.plugins.length >= 3) {
      suggestions.push({
        id: makeId(),
        title: `Extract ${cp.pattern}-framework`,
        description: `${cp.plugins.length} plugins share ${cp.pattern}-related commands. Extract shared infrastructure into a reusable framework plugin.`,
        rationale: `Commands like ${cp.matchedCommands.slice(0, 3).join(", ")} appear across ${cp.plugins.length} plugins. A shared framework would reduce duplication and standardize the pattern.`,
        type: "pattern-extraction",
        priority: cp.plugins.length >= 4 ? "high" : "medium",
        basedOn: cp.plugins,
        suggestedName: `${cp.pattern}-framework`,
        suggestedCommands: [
          `${cp.pattern}-init`,
          `${cp.pattern}-run`,
          `${cp.pattern}-report`,
        ],
        suggestedSkills: [`${cp.pattern}-workflow`],
        suggestedAgents: [],
        hasMcp: false,
        hasHooks: false,
        suggestedCategory: "development",
      });
    }
  }

  return suggestions;
}

// Rule 2: Domain expansion — a domain has audit but no scaffold, or vice versa
function suggestDomainExpansion(
  analysis: PatternAnalysis,
  plugins: PluginSummary[]
): PluginSuggestion[] {
  const suggestions: PluginSuggestion[] = [];

  for (const dg of analysis.domainGroups) {
    const domainPlugins = plugins.filter((p) =>
      dg.plugins.includes(p.name)
    );

    // Check what capabilities the domain has
    const hasAudit = domainPlugins.some((p) => p.hasCommands);
    const hasMcp = domainPlugins.some((p) => p.hasMcp);
    const hasSkills = domainPlugins.some((p) => p.hasSkills);

    // If domain has plugins but none with MCP → suggest MCP integration
    if (!hasMcp && domainPlugins.length >= 3) {
      suggestions.push({
        id: makeId(),
        title: `Add MCP integration for ${dg.domain}`,
        description: `The ${dg.domain} domain has ${dg.plugins.length} plugins but none with MCP server integration. Adding API access could unlock new capabilities.`,
        rationale: `Domain "${dg.domain}" (${dg.plugins.join(", ")}) could benefit from external API integrations via MCP.`,
        type: "domain-expansion",
        priority: "medium",
        basedOn: dg.plugins,
        suggestedName: `${dg.domain}-api`,
        suggestedCommands: [`${dg.domain}-connect`, `${dg.domain}-status`],
        suggestedSkills: [],
        suggestedAgents: [],
        hasMcp: true,
        hasHooks: false,
        suggestedCategory: "development",
      });
    }

    // If domain has commands but no skills → suggest skill-based workflow
    if (hasAudit && !hasSkills && domainPlugins.length >= 2) {
      suggestions.push({
        id: makeId(),
        title: `Add workflow skills for ${dg.domain}`,
        description: `The ${dg.domain} plugins have commands but no skills. Skills would make workflows more discoverable and guided.`,
        rationale: `Converting ${dg.domain} command workflows into skills enables better auto-discovery and natural language triggering.`,
        type: "domain-expansion",
        priority: "low",
        basedOn: dg.plugins,
        suggestedName: `${dg.domain}-workflows`,
        suggestedCommands: [],
        suggestedSkills: [
          `${dg.domain}-quick-start`,
          `${dg.domain}-full-review`,
        ],
        suggestedAgents: [],
        hasMcp: false,
        hasHooks: false,
        suggestedCategory: "productivity",
      });
    }
  }

  return suggestions;
}

// Rule 3: Pipeline completion — detect audit→scaffold→analytics pipeline, suggest missing stages
function suggestPipelineCompletion(
  analysis: PatternAnalysis
): PluginSuggestion[] {
  const suggestions: PluginSuggestion[] = [];

  const hasAudit = analysis.structuralPatterns.some(
    (sp) => sp.id === "audit-checklist"
  );
  const hasScaffold = analysis.structuralPatterns.some(
    (sp) => sp.id === "scaffold-commands"
  );
  const hasAnalyticsPattern = analysis.commandPatterns.some(
    (cp) => cp.pattern === "analytics"
  );

  // If we have audit and scaffold but no analytics → suggest analytics
  if (hasAudit && hasScaffold && !hasAnalyticsPattern) {
    const auditPlugins =
      analysis.structuralPatterns.find((sp) => sp.id === "audit-checklist")
        ?.plugins || [];
    suggestions.push({
      id: makeId(),
      title: "Add analytics pipeline stage",
      description:
        "The ecosystem has audit and scaffold stages but no analytics/reporting. Complete the pipeline with metrics tracking.",
      rationale:
        "A full development pipeline runs: scaffold → develop → audit → report. Adding analytics completes the feedback loop.",
      type: "pipeline-completion",
      priority: "medium",
      basedOn: auditPlugins.slice(0, 3),
      suggestedName: "plugin-analytics",
      suggestedCommands: [
        "analytics-report",
        "analytics-track",
        "analytics-dashboard",
      ],
      suggestedSkills: ["analytics-overview"],
      suggestedAgents: [],
      hasMcp: false,
      hasHooks: true,
      suggestedCategory: "monitoring",
    });
  }

  return suggestions;
}

// Rule 4: MCP template — plugins wrapping external APIs → suggest templatizing
function suggestMcpTemplates(
  analysis: PatternAnalysis,
  plugins: PluginSummary[]
): PluginSuggestion[] {
  const suggestions: PluginSuggestion[] = [];

  const mcpPattern = analysis.structuralPatterns.find(
    (sp) => sp.id === "mcp-wrapper"
  );
  if (mcpPattern && mcpPattern.plugins.length >= 2) {
    suggestions.push({
      id: makeId(),
      title: "Templatize MCP wrapper pattern",
      description: `${mcpPattern.plugins.length} plugins use MCP to wrap external APIs. Create a template that standardizes the MCP integration pattern.`,
      rationale: `Plugins ${mcpPattern.plugins.join(", ")} all follow a similar MCP wrapper pattern. A template would accelerate creating new API integrations.`,
      type: "mcp-template",
      priority: "medium",
      basedOn: mcpPattern.plugins,
      suggestedName: "mcp-api-template",
      suggestedCommands: ["api-connect", "api-status", "api-test"],
      suggestedSkills: ["api-integration"],
      suggestedAgents: [],
      hasMcp: true,
      hasHooks: false,
      suggestedCategory: "development",
    });
  }

  return suggestions;
}

// Rule 5: Cross-domain — domain-specific plugin has generic-applicable patterns
function suggestCrossDomain(
  analysis: PatternAnalysis,
  plugins: PluginSummary[]
): PluginSuggestion[] {
  const suggestions: PluginSuggestion[] = [];

  // Look for domain-specific plugins that have patterns applicable to other domains
  for (const dg of analysis.domainGroups) {
    // Find other projects that could benefit from the same plugin patterns
    const domainPluginNames = new Set(dg.plugins);

    // Check if any audit plugins are domain-specific but could be generalized
    for (const sp of analysis.structuralPatterns) {
      if (sp.id !== "audit-checklist") continue;

      const domainAuditPlugins = sp.plugins.filter((p) =>
        domainPluginNames.has(p)
      );
      if (domainAuditPlugins.length > 0 && dg.plugins.length >= 3) {
        // This domain has audit patterns that could be expanded
        const nonDomainProjects = plugins
          .filter((p) => !domainPluginNames.has(p.name))
          .map((p) => p.name)
          .slice(0, 3);

        if (nonDomainProjects.length > 0) {
          suggestions.push({
            id: makeId(),
            title: `Expand ${dg.domain} audit to other projects`,
            description: `The ${dg.domain} domain has well-structured audit commands. Similar audit patterns could benefit other projects like ${nonDomainProjects.join(", ")}.`,
            rationale: `The audit infrastructure in ${domainAuditPlugins.join(", ")} is domain-tested. Generalizing it would help the broader ecosystem.`,
            type: "cross-domain",
            priority: "low",
            basedOn: domainAuditPlugins,
            suggestedName: "universal-audit",
            suggestedCommands: [
              "audit-run",
              "audit-configure",
              "audit-report",
            ],
            suggestedSkills: ["audit-workflow"],
            suggestedAgents: ["audit-reviewer"],
            hasMcp: false,
            hasHooks: false,
            suggestedCategory: "development",
          });
          break; // Only suggest once
        }
      }
    }
  }

  return suggestions;
}

export function generateSuggestions(
  analysis: PatternAnalysis,
  plugins: PluginSummary[]
): PluginSuggestion[] {
  // Reset ID counter
  nextId = 1;

  const all: PluginSuggestion[] = [
    ...suggestPatternExtraction(analysis),
    ...suggestDomainExpansion(analysis, plugins),
    ...suggestPipelineCompletion(analysis),
    ...suggestMcpTemplates(analysis, plugins),
    ...suggestCrossDomain(analysis, plugins),
  ];

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  all.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return all;
}
