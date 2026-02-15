import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { marketplaces } from "../../marketplace.config";
import type { CloneRequest, CloneResult } from "./types";

export function normalizeGitHubUrl(
  input: string
): { cloneUrl: string; fullName: string } | null {
  const trimmed = input.trim();

  // owner/repo shorthand
  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return {
      cloneUrl: `https://github.com/${shortMatch[1]}/${shortMatch[2]}.git`,
      fullName: `${shortMatch[1]}/${shortMatch[2]}`,
    };
  }

  // Full HTTPS URL
  const httpsMatch = trimmed.match(
    /https?:\/\/github\.com\/([^/]+)\/([^/.]+?)(?:\.git)?(?:\/.*)?$/
  );
  if (httpsMatch) {
    return {
      cloneUrl: `https://github.com/${httpsMatch[1]}/${httpsMatch[2]}.git`,
      fullName: `${httpsMatch[1]}/${httpsMatch[2]}`,
    };
  }

  // SSH URL
  const sshMatch = trimmed.match(
    /git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/
  );
  if (sshMatch) {
    return {
      cloneUrl: `git@github.com:${sshMatch[1]}/${sshMatch[2]}.git`,
      fullName: `${sshMatch[1]}/${sshMatch[2]}`,
    };
  }

  return null;
}

export function clonePlugin(request: CloneRequest): CloneResult {
  const normalized = normalizeGitHubUrl(request.url);
  if (!normalized) {
    return {
      success: false,
      error: `Invalid GitHub URL or shorthand: ${request.url}`,
      isPlugin: false,
      registeredInManifest: false,
    };
  }

  const mkt = marketplaces.find((m) => m.id === request.targetMarketplace);
  if (!mkt) {
    return {
      success: false,
      error: `Unknown marketplace: ${request.targetMarketplace}`,
      isPlugin: false,
      registeredInManifest: false,
    };
  }

  const pluginsDir = path.join(mkt.path, "plugins");
  const repoName = normalized.fullName.split("/")[1];
  const targetDir = path.join(pluginsDir, repoName);

  if (fs.existsSync(targetDir)) {
    return {
      success: false,
      error: `Directory already exists: ${targetDir}`,
      isPlugin: false,
      registeredInManifest: false,
    };
  }

  // Ensure plugins/ dir exists
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  try {
    execSync(
      `git clone ${normalized.cloneUrl} ${JSON.stringify(targetDir)} 2>&1`,
      { stdio: "pipe", timeout: 60_000 }
    );
  } catch (err) {
    return {
      success: false,
      error: `Clone failed: ${err instanceof Error ? err.message : String(err)}`,
      isPlugin: false,
      registeredInManifest: false,
    };
  }

  const isPlugin = fs.existsSync(path.join(targetDir, ".claude-plugin"));

  // Register in manifest (reuses pattern from plugin-scaffolder.ts:214-248)
  let registeredInManifest = false;
  if (request.registerInManifest && isPlugin) {
    const manifestPath = path.join(mkt.path, ".claude-plugin", "marketplace.json");
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        const exists = manifest.plugins?.some(
          (p: { name: string }) => p.name === repoName
        );
        if (!exists) {
          // Try to read plugin.json for description
          let description = "";
          try {
            const pj = JSON.parse(
              fs.readFileSync(
                path.join(targetDir, ".claude-plugin", "plugin.json"),
                "utf-8"
              )
            );
            description = pj.description || "";
          } catch {
            // no-op
          }

          const entry: Record<string, string> = {
            name: repoName,
            description,
            source: `plugins/${repoName}`,
          };
          manifest.plugins = manifest.plugins || [];
          manifest.plugins.push(entry);
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
          registeredInManifest = true;
        }
      } catch {
        // Non-fatal: manifest update failed
      }
    }
  }

  return {
    success: true,
    pluginPath: targetDir,
    pluginName: repoName,
    isPlugin,
    registeredInManifest,
  };
}
