import { NextRequest } from "next/server";
import { clonePlugin } from "@/lib/github-clone";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { repository, targetMarketplace } = body;

  if (!repository || typeof repository !== "string") {
    return Response.json({ error: "repository is required" }, { status: 400 });
  }

  // Convert to GitHub URL if needed
  const url = repository.startsWith("http")
    ? repository
    : `https://github.com/${repository}.git`;

  const result = clonePlugin({
    url,
    targetMarketplace: targetMarketplace || "local",
    registerInManifest: true,
  });

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json(result);
}
