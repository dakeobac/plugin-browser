import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import type { LocalGitRepo, SyncStatus } from "./types";
import { marketplaces } from "../../marketplace.config";

export function parseGitHubRemote(
  url: string
): { owner: string; repo: string } | null {
  // HTTPS: https://github.com/owner/repo.git or https://github.com/owner/repo
  const httpsMatch = url.match(
    /github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/
  );
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // SSH: git@github.com:owner/repo.git
  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}

export function scanLocalGitRepos(paths: string[]): LocalGitRepo[] {
  const repos: LocalGitRepo[] = [];
  const marketplacePaths = new Set(marketplaces.map((m) => m.path));

  for (const scanPath of paths) {
    if (!fs.existsSync(scanPath)) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(scanPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

      const dirPath = path.join(scanPath, entry.name);
      const gitDir = path.join(dirPath, ".git");

      if (!fs.existsSync(gitDir)) continue;

      // Get remote URL
      let remoteUrl: string | null = null;
      try {
        remoteUrl = execSync("git remote get-url origin 2>/dev/null", {
          cwd: dirPath,
          stdio: "pipe",
          timeout: 5_000,
        })
          .toString()
          .trim();
      } catch {
        // no remote
      }

      // Parse GitHub owner/repo
      const ghInfo = remoteUrl ? parseGitHubRemote(remoteUrl) : null;
      const githubFullName = ghInfo ? `${ghInfo.owner}/${ghInfo.repo}` : null;

      // Get current branch
      let currentBranch = "unknown";
      try {
        currentBranch = execSync("git branch --show-current 2>/dev/null", {
          cwd: dirPath,
          stdio: "pipe",
          timeout: 5_000,
        })
          .toString()
          .trim() || "HEAD";
      } catch {
        // detached HEAD or error
      }

      // Check if plugin
      const isPlugin = fs.existsSync(path.join(dirPath, ".claude-plugin"));

      // Check if in marketplace
      const isInMarketplace = marketplacePaths.has(dirPath) ||
        [...marketplacePaths].some((mp) => dirPath.startsWith(path.join(mp, "plugins")));

      repos.push({
        path: dirPath,
        name: entry.name,
        remoteUrl,
        githubFullName,
        currentBranch,
        syncStatus: {
          state: remoteUrl ? "unknown" : "no-remote",
          ahead: 0,
          behind: 0,
          lastChecked: "",
        },
        isPlugin,
        isInMarketplace,
      });
    }
  }

  // Only return repos that have a GitHub remote
  return repos.filter((r) => r.githubFullName !== null);
}

export function fetchSyncStatus(repoPath: string): SyncStatus {
  const now = new Date().toISOString();

  try {
    // Get default branch
    let branch = "main";
    try {
      branch = execSync("git branch --show-current 2>/dev/null", {
        cwd: repoPath,
        stdio: "pipe",
        timeout: 5_000,
      })
        .toString()
        .trim() || "main";
    } catch {
      // use default
    }

    // Fetch from origin
    execSync("git fetch origin 2>/dev/null", {
      cwd: repoPath,
      stdio: "pipe",
      timeout: 30_000,
    });

    // Check ahead/behind
    const output = execSync(
      `git rev-list --count --left-right HEAD...origin/${branch} 2>/dev/null`,
      { cwd: repoPath, stdio: "pipe", timeout: 5_000 }
    )
      .toString()
      .trim();

    const parts = output.split(/\s+/);
    const ahead = parseInt(parts[0], 10) || 0;
    const behind = parseInt(parts[1], 10) || 0;

    let state: SyncStatus["state"];
    if (ahead === 0 && behind === 0) state = "up-to-date";
    else if (ahead > 0 && behind > 0) state = "diverged";
    else if (ahead > 0) state = "ahead";
    else state = "behind";

    return { state, ahead, behind, lastChecked: now };
  } catch {
    return { state: "unknown", ahead: 0, behind: 0, lastChecked: now };
  }
}

export function pullRepo(
  repoPath: string
): { success: boolean; output: string } {
  try {
    const output = execSync("git pull 2>&1", {
      cwd: repoPath,
      stdio: "pipe",
      timeout: 30_000,
    }).toString();
    return { success: true, output };
  } catch (err) {
    return {
      success: false,
      output: err instanceof Error ? err.message : String(err),
    };
  }
}
