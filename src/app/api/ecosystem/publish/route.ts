import { NextRequest } from "next/server";
import { publishPlugin, validateForPublish } from "@/lib/publisher";
import { loadAllPlugins } from "@/lib/marketplace-loader";
import { loadPluginDetail } from "@/lib/plugin-parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pluginSlug, displayName, description, tags, category, platform, repositoryUrl } = body;

  if (!pluginSlug || typeof pluginSlug !== "string") {
    return Response.json({ error: "pluginSlug is required" }, { status: 400 });
  }

  // Find plugin summary by slug
  const { plugins } = loadAllPlugins();
  const summary = plugins.find((p) => p.slug === pluginSlug);
  if (!summary) {
    return Response.json({ error: "Plugin not found" }, { status: 404 });
  }

  // Load full detail
  const detail = loadPluginDetail(summary);

  // Validate
  const validation = validateForPublish(detail);
  if (!validation.valid) {
    return Response.json({
      error: "Validation failed",
      details: validation.errors
    }, { status: 400 });
  }

  // Publish
  const authorStr = typeof detail.author === "string" ? detail.author : (detail.author as { name: string })?.name;
  const result = await publishPlugin(
    {
      pluginSlug,
      displayName: displayName || detail.name,
      description: description || detail.description,
      tags: tags || detail.keywords || [],
      category: category || detail.category || "uncategorized",
      platform: platform || detail.platform || "claude-code",
      repositoryUrl,
    },
    detail.pluginPath,
    { name: detail.name, version: detail.version, author: authorStr },
  );

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json(result);
}
