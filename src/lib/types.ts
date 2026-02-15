export interface AntiFeatures {
  usesNetwork: boolean;
  executesShell: boolean;
  requiresApiKeys: boolean;
  hasNonFreeDeps: boolean;
}

export interface AntiFeatureMeta {
  label: string;
  description: string;
  severity: "info" | "warn" | "danger";
}

export const ANTI_FEATURE_META: Record<keyof AntiFeatures, AntiFeatureMeta> = {
  usesNetwork: {
    label: "Network Access",
    description: "This plugin connects to external servers via MCP",
    severity: "warn",
  },
  executesShell: {
    label: "Shell Commands",
    description: "This plugin executes shell commands via hooks",
    severity: "danger",
  },
  requiresApiKeys: {
    label: "API Keys",
    description: "This plugin requires API keys or tokens",
    severity: "warn",
  },
  hasNonFreeDeps: {
    label: "Non-Free Dependencies",
    description: "This plugin depends on proprietary services",
    severity: "info",
  },
};

export interface UpdateInfo {
  installedVersion?: string;
  availableVersion?: string;
  hasUpdate: boolean;
}

export interface FeaturedPlugin {
  slug: string;
  tagline?: string;
}

export interface PluginUserData {
  rating?: number;
  note?: string;
  updatedAt?: string;
}

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
  platform?: "claude-code" | "opencode";
  pluginPath: string;
  isSymlink: boolean;
  symlinkTarget?: string;
  homepage?: string;
  keywords?: string[];
  installInfo?: {
    isInstalled: boolean;
    isEnabled: boolean;
    cliName: string | null;
  };
  antiFeatures?: AntiFeatures;
  updateInfo?: UpdateInfo;
  userData?: PluginUserData;
}

export interface PluginDetail extends PluginSummary {
  readme?: string;
  commands: string[];
  skills: string[];
  agents: string[];
}

// --- Scanner types ---

export interface DiscoveredPlugin {
  name: string;
  description: string;
  version?: string;
  platform?: "claude-code" | "opencode";
  path: string;
  realPath: string;
  hasPluginJson: boolean;
  hasCommands: boolean;
  hasSkills: boolean;
  hasMcp: boolean;
  hasHooks: boolean;
  hasAgents: boolean;
  commandCount: number;
  skillCount: number;
  agentCount: number;
  registeredIn: string[]; // marketplace IDs where this plugin is registered
}

export interface ScanResult {
  plugins: DiscoveredPlugin[];
  totalScanned: number;
  scanPaths: string[];
}

// --- Pattern Analyzer types ---

export interface PluginFingerprint {
  name: string;
  marketplace: string;
  slug: string;
  commandNames: string[];
  skillNames: string[];
  agentNames: string[];
  hasMcp: boolean;
  hasHooks: boolean;
  domain?: string; // extracted domain prefix (e.g. "glintlock" from "glintlock-seo")
}

export interface CommandPattern {
  pattern: string; // e.g. "audit", "add-*", "new-*"
  description: string;
  plugins: string[]; // plugin names
  matchedCommands: string[]; // actual command names
}

export interface StructuralPattern {
  id: string;
  name: string;
  description: string;
  plugins: string[]; // plugin names
  pluginSlugs: string[]; // for linking
}

export interface DomainGroup {
  domain: string;
  plugins: string[];
  pluginSlugs: string[];
}

export interface PatternAnalysis {
  commandPatterns: CommandPattern[];
  structuralPatterns: StructuralPattern[];
  domainGroups: DomainGroup[];
}

// --- Suggestion types ---

export type SuggestionType =
  | "pattern-extraction"
  | "domain-expansion"
  | "pipeline-completion"
  | "mcp-template"
  | "cross-domain";

export interface PluginSuggestion {
  id: string;
  title: string;
  description: string;
  rationale: string;
  type: SuggestionType;
  priority: "high" | "medium" | "low";
  basedOn: string[]; // plugin names this is derived from
  suggestedName: string;
  suggestedCommands: string[];
  suggestedSkills: string[];
  suggestedAgents: string[];
  hasMcp: boolean;
  hasHooks: boolean;
  suggestedCategory?: string;
}

// --- Scaffolder types ---

export interface ScaffoldRequest {
  name: string;
  description: string;
  category?: string;
  targetMarketplace: string; // marketplace ID
  commands: string[];
  skills: string[];
  agents: string[];
  includeMcp: boolean;
  includeHooks: boolean;
  registerInManifest: boolean;
  author?: string;
}

export interface ScaffoldResult {
  success: boolean;
  pluginPath?: string;
  filesCreated?: string[];
  registeredInManifest?: boolean;
  error?: string;
}

// --- Chat / Agent types ---

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: ContentBlock[];
  timestamp: number;
  isStreaming?: boolean;
}

export interface SessionMeta {
  id: string;
  title: string;
  createdAt: string;
  lastUsedAt: string;
  pluginContext?: string;
  platform?: "claude-code" | "opencode";
}

export type ClaudeEvent =
  | {
      type: "assistant";
      session_id?: string;
      message?: { role: string; content: ContentBlock[] };
      uuid?: string;
    }
  | {
      type: "user";
      session_id?: string;
      message?: { role: string; content: ContentBlock[] };
      uuid?: string;
    }
  | {
      type: "system";
      session_id?: string;
      subtype?: string;
      uuid?: string;
    }
  | {
      type: "result";
      session_id?: string;
      result?: string;
      subtype?: string;
      uuid?: string;
    }
  | {
      type: "tool_progress";
      session_id?: string;
      tool_use_id?: string;
      tool_name?: string;
      elapsed_time_seconds?: number;
      uuid?: string;
    }
  | { type: "error"; message?: string }
  | { type: "status"; message?: string }
  | { type: "done" };

// --- AI Analysis types ---

export interface AiAnalysisResult {
  patterns: AiPattern[];
  suggestions: AiSuggestion[];
  status: "idle" | "loading" | "done" | "error";
  error?: string;
}

export interface AiPattern {
  name: string;
  description: string;
  plugins: string[];
  type: "command" | "structural" | "domain";
}

export interface AiSuggestion {
  title: string;
  description: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  suggestedName: string;
  suggestedCommands: string[];
  suggestedSkills: string[];
  platform: "claude-code" | "opencode" | "both";
}

// --- Plugin Frontend types ---

export interface PluginFrontend {
  slug: string;
  name: string;
  pluginPath: string;
  frontendFile: string;
  frontendUrl: string;
}

// --- GitHub Integration types ---

export interface GitHubAccount {
  username: string;
  host: string;          // "github.com" or GHE hostname
  protocol: "https" | "ssh";
  isActive: boolean;
}

export interface GitHubRepo {
  fullName: string;      // "owner/repo"
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  isPrivate: boolean;
  isFork: boolean;
  defaultBranch: string;
  updatedAt: string;
  topics: string[];
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  isPlugin: boolean;     // has claude-plugin topic or .claude-plugin dir
}

export interface LocalGitRepo {
  path: string;
  name: string;
  remoteUrl: string | null;
  githubFullName: string | null;  // parsed "owner/repo"
  currentBranch: string;
  syncStatus: SyncStatus;
  isPlugin: boolean;              // has .claude-plugin directory
  isInMarketplace: boolean;
}

export type SyncStatus = {
  state: "up-to-date" | "ahead" | "behind" | "diverged" | "no-remote" | "unknown";
  ahead: number;
  behind: number;
  lastChecked: string;
};

export interface CloneRequest {
  url: string;
  targetMarketplace: string;
  registerInManifest: boolean;
}

export interface CloneResult {
  success: boolean;
  pluginPath?: string;
  pluginName?: string;
  error?: string;
  isPlugin: boolean;
  registeredInManifest: boolean;
}

export interface GitHubData {
  accounts: GitHubAccount[];
  repoCache: Record<string, { repos: GitHubRepo[]; fetchedAt: string }>;
}

// --- Brief Parser types ---

export interface ParsedBriefSpec {
  name: string;
  displayName: string;
  description: string;
  category: string;
  commands: string[];
  skills: string[];
  agents: string[];
  hasMcp: boolean;
  hasHooks: boolean;
  summary: string;
  confidence: "high" | "medium" | "low";
}

// --- Agent Registry types ---

export type AgentRuntime = "claude-code" | "opencode";
export type AgentStatus = "idle" | "running" | "paused" | "error" | "terminated";

export interface McpServerRef {
  id: string;
  name: string;
}

export interface AgentConfig {
  runtime: AgentRuntime;
  cwd?: string;
  systemPrompt?: string;
  maxTurns?: number;
  permissionMode?: string;
  mcpServers?: McpServerRef[];
  env?: Record<string, string>;
}

export interface AgentInstance {
  id: string;
  pluginSlug?: string;
  agentName: string;
  displayName: string;
  status: AgentStatus;
  runtime: AgentRuntime;
  sessionId?: string;
  startedAt?: string;
  lastActivity?: string;
  config: AgentConfig;
  error?: string;
}

export interface AgentInstanceSummary {
  id: string;
  agentName: string;
  displayName: string;
  status: AgentStatus;
  runtime: AgentRuntime;
  pluginSlug?: string;
  startedAt?: string;
  lastActivity?: string;
}

export interface AgentLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: Record<string, unknown>;
}

// --- Background Build types ---

export type BuildStatus = "building" | "done" | "error";

export interface BackgroundBuild {
  id: string;
  pluginName: string;
  pluginPath: string;
  status: BuildStatus;
  sessionId: string | null;
  messages: ChatMessage[];
  startedAt: number;
  completedAt: number | null;
  error: string | null;
}
