import fs from "fs";
import path from "path";
import os from "os";
import type { FeaturedPlugin } from "./types";

const featuredPath = path.join(
  os.homedir(),
  ".claude",
  "plugin-browser",
  "featured.json"
);

export function loadFeaturedPlugins(): FeaturedPlugin[] {
  try {
    const data = JSON.parse(fs.readFileSync(featuredPath, "utf-8"));
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item: unknown) =>
        item && typeof item === "object" && "slug" in (item as Record<string, unknown>)
    );
  } catch {
    return [];
  }
}
