import { NextResponse } from "next/server";
import { searchPlugins } from "@/lib/github-cli";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "claude-plugin";

  const repos = searchPlugins(query);
  return NextResponse.json({ repos });
}
