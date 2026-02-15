import { execSync } from "child_process";
import type { GitHubAccount, GitHubRepo } from "./types";

export function isGhInstalled(): boolean {
  try {
    execSync("which gh", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function getAuthenticatedAccounts(): GitHubAccount[] {
  try {
    const output = execSync("gh auth status 2>&1", {
      stdio: "pipe",
      timeout: 10_000,
    }).toString();

    const accounts: GitHubAccount[] = [];
    // Parse lines like: "  github.com" and "    Logged in to github.com account username (..."
    const lines = output.split("\n");
    let currentHost = "github.com";

    for (const line of lines) {
      // Match host header lines like "github.com"
      const hostMatch = line.match(/^\s{0,2}(\S+\.(?:com|io|org|net)\S*)/);
      if (hostMatch) {
        currentHost = hostMatch[1];
      }

      // Match "Logged in to ... account USERNAME"
      const accountMatch = line.match(
        /Logged in to (\S+) account (\S+)/
      );
      if (accountMatch) {
        const host = accountMatch[1];
        const username = accountMatch[2];
        const protocol = line.includes("ssh") ? "ssh" as const : "https" as const;
        accounts.push({
          username,
          host,
          protocol,
          isActive: true,
        });
      }
    }

    // Fallback: try `gh api /user`
    if (accounts.length === 0) {
      try {
        const userJson = execSync("gh api /user 2>/dev/null", {
          stdio: "pipe",
          timeout: 10_000,
        }).toString();
        const user = JSON.parse(userJson);
        if (user.login) {
          accounts.push({
            username: user.login,
            host: currentHost,
            protocol: "https",
            isActive: true,
          });
        }
      } catch {
        // no-op
      }
    }

    return accounts;
  } catch {
    return [];
  }
}

export function fetchUserRepos(username: string): GitHubRepo[] {
  try {
    const fields = [
      "name",
      "description",
      "primaryLanguage",
      "stargazerCount",
      "isPrivate",
      "isFork",
      "defaultBranchRef",
      "updatedAt",
      "repositoryTopics",
      "url",
      "sshUrl",
      "owner",
    ].join(",");

    const output = execSync(
      `gh repo list ${escapeArg(username)} --json ${fields} --limit 100 2>/dev/null`,
      { stdio: "pipe", timeout: 30_000 }
    ).toString();

    const raw = JSON.parse(output);
    return raw.map((r: Record<string, unknown>) => mapRepoFromGh(r));
  } catch {
    return [];
  }
}

export function searchPlugins(query: string): GitHubRepo[] {
  try {
    const q = encodeURIComponent(`${query} topic:claude-plugin`);
    const output = execSync(
      `gh api "/search/repositories?q=${q}&sort=stars&per_page=30" 2>/dev/null`,
      { stdio: "pipe", timeout: 30_000 }
    ).toString();

    const data = JSON.parse(output);
    const items = data.items || [];
    return items.map((r: Record<string, unknown>) => mapRepoFromApi(r));
  } catch {
    return [];
  }
}

export function getRepoInfo(fullName: string): GitHubRepo | null {
  try {
    const output = execSync(
      `gh api "/repos/${escapeArg(fullName)}" 2>/dev/null`,
      { stdio: "pipe", timeout: 15_000 }
    ).toString();

    const r = JSON.parse(output);
    return mapRepoFromApi(r);
  } catch {
    return null;
  }
}

// Map from `gh repo list --json` format
function mapRepoFromGh(r: Record<string, unknown>): GitHubRepo {
  const owner = (r.owner as Record<string, string>)?.login || "";
  const name = r.name as string;
  const topics = ((r.repositoryTopics as Array<{ name: string }>) || []).map(
    (t) => t.name
  );
  const defaultBranch =
    (r.defaultBranchRef as Record<string, string>)?.name || "main";

  return {
    fullName: `${owner}/${name}`,
    name,
    owner,
    description: (r.description as string) || null,
    language: (r.primaryLanguage as Record<string, string>)?.name || null,
    stars: (r.stargazerCount as number) || 0,
    isPrivate: (r.isPrivate as boolean) || false,
    isFork: (r.isFork as boolean) || false,
    defaultBranch,
    updatedAt: (r.updatedAt as string) || "",
    topics,
    htmlUrl: (r.url as string) || `https://github.com/${owner}/${name}`,
    cloneUrl: `https://github.com/${owner}/${name}.git`,
    sshUrl: (r.sshUrl as string) || `git@github.com:${owner}/${name}.git`,
    isPlugin: topics.includes("claude-plugin"),
  };
}

// Map from GitHub REST API format
function mapRepoFromApi(r: Record<string, unknown>): GitHubRepo {
  const owner = (r.owner as Record<string, string>)?.login || "";
  const name = r.name as string;
  const topics = (r.topics as string[]) || [];

  return {
    fullName: (r.full_name as string) || `${owner}/${name}`,
    name,
    owner,
    description: (r.description as string) || null,
    language: (r.language as string) || null,
    stars: (r.stargazers_count as number) || 0,
    isPrivate: (r.private as boolean) || false,
    isFork: (r.fork as boolean) || false,
    defaultBranch: (r.default_branch as string) || "main",
    updatedAt: (r.updated_at as string) || "",
    topics,
    htmlUrl: (r.html_url as string) || `https://github.com/${owner}/${name}`,
    cloneUrl: (r.clone_url as string) || `https://github.com/${owner}/${name}.git`,
    sshUrl: (r.ssh_url as string) || `git@github.com:${owner}/${name}.git`,
    isPlugin: topics.includes("claude-plugin"),
  };
}

function escapeArg(s: string): string {
  return s.replace(/[^a-zA-Z0-9._\-/]/g, "");
}
