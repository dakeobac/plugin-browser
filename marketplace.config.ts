export interface MarketplaceSource {
  id: string;
  name: string;
  path: string;
}

export const marketplaces: MarketplaceSource[] = [
  {
    id: "personal",
    name: "Personal",
    path: "/Users/dakeobac/Coding/claude-plugins",
  },
  {
    id: "local",
    name: "Local Dev",
    path: "/Users/dakeobac/.claude/local-marketplace",
  },
  {
    id: "official",
    name: "Anthropic Official",
    path: "/Users/dakeobac/.claude/plugins/marketplaces/claude-code-plugins",
  },
  {
    id: "community",
    name: "Anthropic Community",
    path: "/Users/dakeobac/.claude/plugins/marketplaces/claude-plugins-official",
  },
];

export const scanPaths: string[] = [
  "/Users/dakeobac/Coding",
];

export const opencodePaths: string[] = [
  "/Users/dakeobac/Coding",
];
