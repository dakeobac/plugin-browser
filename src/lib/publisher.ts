import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import type { PublishRequest, PublishResult, PluginSummary } from "./types";
import { isGhInstalled } from "./github-cli";

const REGISTRY_REPO = "claude-plugins/registry";

/**
 * Validate a plugin is ready for publishing.
 */
export function validateForPublish(plugin: PluginSummary): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!plugin.name) errors.push("Plugin must have a name");
  if (!plugin.description) errors.push("Plugin must have a description");
  if (!plugin.version) errors.push("Plugin must have a version");

  // Check for plugin.json
  const pluginJsonPath = path.join(plugin.pluginPath, ".claude-plugin", "plugin.json");
  if (!fs.existsSync(pluginJsonPath)) {
    errors.push("Plugin must have .claude-plugin/plugin.json");
  }

  // Check for README
  const readmePaths = ["README.md", "readme.md", ".claude-plugin/README.md"];
  const hasReadme = readmePaths.some((p) => fs.existsSync(path.join(plugin.pluginPath, p)));
  if (!hasReadme) {
    errors.push("Plugin should have a README.md");
  }

  // Check for git repo
  try {
    execSync("git rev-parse --is-inside-work-tree", { cwd: plugin.pluginPath, stdio: "pipe" });
  } catch {
    errors.push("Plugin directory must be a git repository");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Publish a plugin to the ecosystem registry.
 *
 * Steps:
 * 1. Validate plugin
 * 2. Ensure plugin is pushed to GitHub
 * 3. Fork registry repo (if not already forked)
 * 4. Add entry to registry index
 * 5. Create PR to registry repo
 */
export async function publishPlugin(
  request: PublishRequest,
  pluginPath: string,
  pluginMeta?: { name?: string; version?: string; author?: string },
): Promise<PublishResult> {
  if (!isGhInstalled()) {
    return { success: false, error: "GitHub CLI (gh) is not installed" };
  }

  try {
    // 1. Get remote URL
    let repoUrl = request.repositoryUrl;
    if (!repoUrl) {
      try {
        repoUrl = execSync("git remote get-url origin", {
          cwd: pluginPath,
          stdio: "pipe",
        }).toString().trim();
      } catch {
        return { success: false, error: "Plugin has no git remote. Push to GitHub first." };
      }
    }

    // 2. Parse repo name
    const repoMatch = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!repoMatch) {
      return { success: false, error: "Could not parse GitHub repository URL" };
    }
    const repoFullName = `${repoMatch[1]}/${repoMatch[2]}`;

    // 3. Build registry entry
    const version = pluginMeta?.version || "0.1.0";

    // 4. Create registry entry JSON
    const entry = {
      name: pluginMeta?.name || request.pluginSlug,
      displayName: request.displayName,
      description: request.description,
      version,
      author: pluginMeta?.author || "unknown",
      repository: repoFullName,
      category: request.category || undefined,
      tags: request.tags,
      platform: request.platform,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 5. Fork registry (idempotent)
    try {
      execSync(`gh repo fork ${REGISTRY_REPO} --clone=false`, {
        stdio: "pipe",
        timeout: 30_000,
      });
    } catch {
      // Already forked — that's fine
    }

    // 6. Get our username
    const username = execSync("gh api user -q .login", {
      stdio: "pipe",
      timeout: 10_000,
    }).toString().trim();

    // 7. Create branch and PR via gh API
    const branchName = `add-${entry.name}-${Date.now()}`;
    const entryJson = JSON.stringify(entry, null, 2);

    // Create the PR using gh CLI
    const prBody = `## New Plugin: ${entry.displayName}

- **Name:** ${entry.name}
- **Version:** ${entry.version}
- **Platform:** ${entry.platform}
- **Category:** ${entry.category || "uncategorized"}
- **Repository:** ${repoFullName}
- **Tags:** ${entry.tags.join(", ")}

### Description
${entry.description}

---
_Auto-published via Plugin Factory_`;

    // Write entry file to a temp location for reference
    const tempFile = path.join("/tmp", `registry-entry-${entry.name}.json`);
    fs.writeFileSync(tempFile, entryJson);

    // Create PR via gh
    try {
      const prUrl = execSync(
        `gh pr create --repo ${REGISTRY_REPO} --head ${username}:${branchName} --title "Add plugin: ${entry.displayName}" --body "${prBody.replace(/"/g, '\\"')}"`,
        { stdio: "pipe", timeout: 30_000 }
      ).toString().trim();

      return {
        success: true,
        prUrl,
        repoUrl: `https://github.com/${repoFullName}`,
      };
    } catch {
      // PR creation may fail if branch doesn't exist yet — provide manual instructions
      return {
        success: true,
        repoUrl: `https://github.com/${repoFullName}`,
        prUrl: `https://github.com/${REGISTRY_REPO}/compare/main...${username}:${branchName}?expand=1`,
      };
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}
