import { NextResponse } from "next/server";
import { scanLocalGitRepos, fetchSyncStatus, pullRepo } from "@/lib/github-sync";
import { scanPaths } from "../../../../../marketplace.config";

export async function GET() {
  const repos = scanLocalGitRepos(scanPaths);
  return NextResponse.json({ repos });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "sync" && body.path) {
      const status = fetchSyncStatus(body.path);
      return NextResponse.json({ status });
    }

    if (body.action === "pull" && body.path) {
      const result = pullRepo(body.path);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: `Unknown action: ${body.action}` },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
