import fs from "fs";
import path from "path";
import os from "os";

const claudeDir = path.join(os.homedir(), ".claude");
const marketplacesDir = path.join(claudeDir, "plugins", "marketplaces");
const localMarketplacePath = path.join(claudeDir, "local-marketplace");

/**
 * Derive the CLI marketplace name from the filesystem path.
 * Returns null for paths that aren't registered CLI marketplaces.
 */
function deriveCliMarketplace(marketplacePath: string): string | null {
  // ~/.claude/plugins/marketplaces/<name> → "<name>"
  if (marketplacePath.startsWith(marketplacesDir + path.sep)) {
    return path.basename(marketplacePath);
  }
  // ~/.claude/local-marketplace → "local"
  if (marketplacePath === localMarketplacePath) {
    return "local";
  }
  return null;
}

export function getCliName(
  pluginName: string,
  marketplacePath: string
): string | null {
  const cliMarketplace = deriveCliMarketplace(marketplacePath);
  if (!cliMarketplace) return null;
  return `${pluginName}@${cliMarketplace}`;
}

export function getInstallState(
  pluginName: string,
  marketplacePath: string
): { isInstalled: boolean; isEnabled: boolean; cliName: string | null } {
  const cliName = getCliName(pluginName, marketplacePath);

  if (!cliName) {
    return { isInstalled: false, isEnabled: false, cliName: null };
  }

  let isInstalled = false;
  let isEnabled = false;

  // Check installed_plugins.json (version 2 format)
  try {
    const installedPath = path.join(claudeDir, "plugins", "installed_plugins.json");
    const data = JSON.parse(fs.readFileSync(installedPath, "utf-8"));
    if (data.plugins && cliName in data.plugins) {
      isInstalled = true;
    }
  } catch {}

  // Check settings.json for enabled state
  try {
    const settingsPath = path.join(claudeDir, "settings.json");
    const data = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    if (data.enabledPlugins && cliName in data.enabledPlugins) {
      isEnabled = true;
    }
  } catch {}

  return { isInstalled, isEnabled, cliName };
}
