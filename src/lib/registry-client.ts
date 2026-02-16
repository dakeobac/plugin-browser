import type { RegistryIndex, RegistryEntry } from "./types";

const REGISTRY_URL = "https://raw.githubusercontent.com/claude-plugins/registry/main/index.json";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// globalThis cache for HMR survival
const globalKey = "__registryCache";

interface CachedRegistry {
  data: RegistryIndex;
  fetchedAt: number;
}

function getCache(): CachedRegistry | null {
  const g = globalThis as unknown as Record<string, CachedRegistry | null>;
  return g[globalKey] || null;
}

function setCache(data: RegistryIndex): void {
  const g = globalThis as unknown as Record<string, CachedRegistry>;
  g[globalKey] = { data, fetchedAt: Date.now() };
}

/**
 * Fetch the registry index, using a 5-minute cache.
 * Falls back to empty registry on network errors.
 */
export async function fetchRegistry(): Promise<RegistryIndex> {
  const cached = getCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(REGISTRY_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(`Registry fetch failed: ${res.status}`);
    }

    const data: RegistryIndex = await res.json();
    setCache(data);
    return data;
  } catch (err) {
    console.error("[RegistryClient] Fetch error:", (err as Error).message);

    // Return cached data if available, even if stale
    if (cached) return cached.data;

    // Empty fallback
    return {
      version: "0.0.0",
      updatedAt: new Date().toISOString(),
      plugins: [],
      agents: [],
      workflows: [],
    };
  }
}

/**
 * Search the registry with query text and optional filters.
 */
export function searchRegistry(
  index: RegistryIndex,
  opts?: {
    query?: string;
    platform?: "claude-code" | "opencode" | "both";
    category?: string;
    tags?: string[];
  },
): RegistryEntry[] {
  let results = [...index.plugins, ...index.agents, ...index.workflows];

  if (opts?.query) {
    const q = opts.query.toLowerCase();
    results = results.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.displayName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  if (opts?.platform && opts.platform !== "both") {
    results = results.filter(
      (e) => e.platform === opts.platform || e.platform === "both",
    );
  }

  if (opts?.category) {
    results = results.filter((e) => e.category === opts.category);
  }

  if (opts?.tags && opts.tags.length > 0) {
    results = results.filter((e) =>
      opts.tags!.some((t) => e.tags.includes(t)),
    );
  }

  // Sort by downloads desc, then name
  results.sort((a, b) => (b.downloads || 0) - (a.downloads || 0) || a.name.localeCompare(b.name));

  return results;
}

/**
 * Get a specific registry entry by name.
 */
export function getRegistryEntry(
  index: RegistryIndex,
  name: string,
): RegistryEntry | undefined {
  return [...index.plugins, ...index.agents, ...index.workflows].find(
    (e) => e.name === name,
  );
}

/**
 * Get unique categories from the registry.
 */
export function getRegistryCategories(index: RegistryIndex): string[] {
  const cats = new Set<string>();
  for (const entry of [...index.plugins, ...index.agents, ...index.workflows]) {
    if (entry.category) cats.add(entry.category);
  }
  return Array.from(cats).sort();
}

/**
 * Get all unique tags from the registry.
 */
export function getRegistryTags(index: RegistryIndex): string[] {
  const tags = new Set<string>();
  for (const entry of [...index.plugins, ...index.agents, ...index.workflows]) {
    for (const tag of entry.tags) tags.add(tag);
  }
  return Array.from(tags).sort();
}
