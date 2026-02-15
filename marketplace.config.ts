import os from "os";
import path from "path";

export interface MarketplaceSource {
  id: string;
  name: string;
  path: string;
}

const home = os.homedir();

export const marketplaces: MarketplaceSource[] = [
  {
    id: "personal",
    name: "Personal",
    path: path.join(home, "Coding", "claude-plugins"),
  },
  {
    id: "local",
    name: "Local Dev",
    path: path.join(home, ".claude", "local-marketplace"),
  },
  {
    id: "official",
    name: "Anthropic Official",
    path: path.join(home, ".claude", "plugins", "marketplaces", "claude-code-plugins"),
  },
  {
    id: "community",
    name: "Anthropic Community",
    path: path.join(home, ".claude", "plugins", "marketplaces", "claude-plugins-official"),
  },
];

export const scanPaths: string[] = [path.join(home, "Coding")];

export const opencodePaths: string[] = [path.join(home, "Coding")];
