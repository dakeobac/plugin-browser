import { NextRequest } from "next/server";
import { fetchRegistry, searchRegistry, getRegistryCategories } from "@/lib/registry-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || undefined;
  const platform = searchParams.get("platform") as "claude-code" | "opencode" | "both" | null;
  const category = searchParams.get("category") || undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()) : undefined;

  const index = await fetchRegistry();
  const results = searchRegistry(index, {
    query,
    platform: platform || undefined,
    category,
    tags,
  });

  const categories = getRegistryCategories(index);

  return Response.json({
    results,
    total: results.length,
    categories,
  });
}
