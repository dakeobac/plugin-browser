import { NextResponse } from "next/server";
import { fetchUserRepos } from "@/lib/github-cli";
import { loadGitHubData, saveGitHubData } from "@/lib/github-data";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "username parameter required" },
      { status: 400 }
    );
  }

  // Check cache
  const data = loadGitHubData();
  const cached = data.repoCache[username];
  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return NextResponse.json({ repos: cached.repos, cached: true });
    }
  }

  // Fetch fresh
  const repos = fetchUserRepos(username);

  // Update cache
  data.repoCache[username] = {
    repos,
    fetchedAt: new Date().toISOString(),
  };
  saveGitHubData(data);

  return NextResponse.json({ repos, cached: false });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "refresh" && body.username) {
      const repos = fetchUserRepos(body.username);

      const data = loadGitHubData();
      data.repoCache[body.username] = {
        repos,
        fetchedAt: new Date().toISOString(),
      };
      saveGitHubData(data);

      return NextResponse.json({ repos, cached: false });
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
