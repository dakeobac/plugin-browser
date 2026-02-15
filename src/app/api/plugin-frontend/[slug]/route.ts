import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { loadAllPlugins } from "@/lib/marketplace-loader";

export const dynamic = "force-dynamic";

const FRONTEND_CANDIDATES = [
  "dashboard.html",
  "index.html",
  "frontend/index.html",
  "ui/index.html",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const { plugins } = loadAllPlugins();
  const plugin = plugins.find((p) => p.slug === decoded);

  if (!plugin) {
    return new Response("Plugin not found", { status: 404 });
  }

  // Find frontend file
  for (const candidate of FRONTEND_CANDIDATES) {
    const fullPath = path.join(plugin.pluginPath, candidate);
    if (fs.existsSync(fullPath)) {
      const html = fs.readFileSync(fullPath, "utf-8");
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  return new Response("No frontend found for this plugin", { status: 404 });
}
