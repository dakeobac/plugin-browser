export interface PluginSummary {
  name: string;
  description: string;
  version?: string;
  category?: string;
  author?: string | { name: string; email?: string; url?: string };
  marketplace: string;
  slug: string;
  hasCommands: boolean;
  hasSkills: boolean;
  hasMcp: boolean;
  hasHooks: boolean;
  hasAgents: boolean;
  commandCount: number;
  skillCount: number;
  agentCount: number;
  pluginPath: string;
  isSymlink: boolean;
  symlinkTarget?: string;
  homepage?: string;
  keywords?: string[];
}

export interface PluginDetail extends PluginSummary {
  readme?: string;
  commands: string[];
  skills: string[];
  agents: string[];
}
