import type { PluginSummary, PluginFrontend } from "./types";

export function buildPluginContextSummary(
  plugins: PluginSummary[],
  frontends: PluginFrontend[]
): string {
  const installed = plugins.filter((p) => p.installInfo?.isInstalled);
  const enabled = installed.filter((p) => p.installInfo?.isEnabled);
  const withUpdates = installed.filter((p) => p.updateInfo?.hasUpdate);

  const lines: string[] = [
    "You are the Plugin Factory assistant on the user's home dashboard.",
    `The user has ${installed.length} installed plugins (${enabled.length} enabled, ${withUpdates.length} with updates available, ${frontends.length} with dashboards).`,
    "",
    "Installed plugins:",
  ];

  for (const p of installed) {
    const status = p.installInfo?.isEnabled ? "enabled" : "disabled";
    const features: string[] = [];
    if (p.hasCommands) features.push(`${p.commandCount} commands`);
    if (p.hasSkills) features.push(`${p.skillCount} skills`);
    if (p.hasAgents) features.push(`${p.agentCount} agents`);
    if (p.hasMcp) features.push("MCP");
    if (p.hasHooks) features.push("hooks");
    const desc = p.description
      ? p.description.length > 80
        ? p.description.slice(0, 77) + "..."
        : p.description
      : "";
    lines.push(
      `- ${p.name}${p.version ? ` v${p.version}` : ""} [${status}] (${features.join(", ") || "no features"}): ${desc}`
    );
  }

  lines.push("");
  lines.push(
    "You can help the user: create new plugins, audit existing plugins, check for updates, suggest plugin ideas based on patterns, parse design briefs into plugins, and answer questions about their plugin ecosystem."
  );

  return lines.join("\n");
}
