# Plugin Browser: Install & Manage Enhancement

Add install state awareness and install/uninstall/enable/disable capabilities to the plugin browser.

## Current State

The plugin browser is a Next.js 16 app at `/Users/dakeobac/Coding/plugin-browser` that reads plugin metadata from filesystem marketplaces and displays them in a grid. It currently has:
- No API routes
- No awareness of which plugins are installed (doesn't read `installed_plugins.json` or `settings.json`)
- A wrong install command on the detail page (`PluginDetail.tsx:113`): `claude --plugin-dir {installPath}` — should be `claude plugin install <name>@<marketplace>`

## Key Files

| File | Purpose |
|------|---------|
| `~/.claude/plugins/installed_plugins.json` | Tracks installed plugins. Key format: `"name@marketplace"` with array of install records |
| `~/.claude/settings.json` | Has `enabledPlugins` object: `"name@marketplace": true/false` |
| `src/lib/types.ts` | `PluginSummary` and `PluginDetail` interfaces |
| `src/lib/marketplace-loader.ts` | Loads plugins from filesystem, builds `PluginSummary` objects |
| `src/components/PluginCard.tsx` | Card component in the grid view |
| `src/components/PluginDetail.tsx` | Full detail page component |
| `marketplace.config.ts` | Maps marketplace IDs to filesystem paths |

## Marketplace ID to CLI Marketplace Name Mapping

The `marketplace.config.ts` has IDs like `"personal"`, `"local"`, `"official"`, `"community"`. The `installed_plugins.json` uses different marketplace names. Here's the mapping:

| Browser marketplace ID | CLI marketplace name (in installed_plugins.json) |
|---|---|
| `personal` | `claude-plugins` (the repo/directory name) |
| `local` | `local` |
| `official` | `claude-code-plugins` |
| `community` | `claude-plugins-official` |

The install command format is: `claude plugin install <plugin-name>@<cli-marketplace-name>`

Example: a plugin named "engram" from the "local" marketplace → `claude plugin install engram@local`

## Implementation Tasks

### 1. Add install state utility (`src/lib/install-state.ts`)

Create a module that reads install state from the two JSON files:

```typescript
import fs from "fs";
import path from "path";

const CLAUDE_DIR = path.join(process.env.HOME || "", ".claude");
const INSTALLED_PATH = path.join(CLAUDE_DIR, "plugins", "installed_plugins.json");
const SETTINGS_PATH = path.join(CLAUDE_DIR, "settings.json");

export interface InstallInfo {
  isInstalled: boolean;
  isEnabled: boolean;
  version?: string;
  installPath?: string;
  cliName: string; // "name@marketplace" format used by CLI
}

// Map browser marketplace IDs to CLI marketplace names
const marketplaceMap: Record<string, string> = {
  personal: "claude-plugins",
  local: "local",
  official: "claude-code-plugins",
  community: "claude-plugins-official",
};

export function getCliName(pluginName: string, marketplaceId: string): string {
  const cliMarketplace = marketplaceMap[marketplaceId] || marketplaceId;
  return `${pluginName}@${cliMarketplace}`;
}

export function getInstallState(pluginName: string, marketplaceId: string): InstallInfo {
  const cliName = getCliName(pluginName, marketplaceId);

  // Read installed_plugins.json
  let installed: Record<string, Array<{ version?: string; installPath?: string }>> = {};
  try {
    const raw = JSON.parse(fs.readFileSync(INSTALLED_PATH, "utf-8"));
    installed = raw.plugins || {};
  } catch {}

  // Read settings.json
  let enabled: Record<string, boolean> = {};
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
    enabled = raw.enabledPlugins || {};
  } catch {}

  const records = installed[cliName];
  const isInstalled = !!records && records.length > 0;
  const isEnabled = enabled[cliName] === true;

  return {
    isInstalled,
    isEnabled,
    version: records?.[0]?.version,
    installPath: records?.[0]?.installPath,
    cliName,
  };
}

export function getAllInstallStates(
  plugins: Array<{ name: string; marketplace: string }>
): Map<string, InstallInfo> {
  const states = new Map<string, InstallInfo>();
  for (const p of plugins) {
    states.set(`${p.marketplace}--${p.name}`, getInstallState(p.name, p.marketplace));
  }
  return states;
}
```

### 2. Create API routes (`src/app/api/plugins/route.ts`)

Create Next.js route handlers that shell out to `claude plugin` CLI:

```
POST /api/plugins/install   { cliName: "engram@local" }
POST /api/plugins/uninstall { cliName: "engram@local" }
POST /api/plugins/enable    { cliName: "engram@local" }
POST /api/plugins/disable   { cliName: "engram@local" }
```

Each handler should:
1. Validate the `cliName` parameter (must match `^[\w-]+@[\w-]+$`)
2. Execute the corresponding `claude plugin <action> <cliName>` command via `child_process.execSync`
3. Return `{ success: true }` or `{ success: false, error: "..." }`

Keep it simple — one route file with a switch on the action:

```typescript
// src/app/api/plugins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(req: NextRequest) {
  const { action, cliName } = await req.json();

  if (!/^[\w-]+@[\w-]+$/.test(cliName)) {
    return NextResponse.json({ success: false, error: "Invalid plugin name" }, { status: 400 });
  }

  const commands: Record<string, string> = {
    install: `claude plugin install ${cliName}`,
    uninstall: `claude plugin uninstall ${cliName}`,
    enable: `claude plugin enable ${cliName}`,
    disable: `claude plugin disable ${cliName}`,
  };

  const cmd = commands[action];
  if (!cmd) {
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  }

  try {
    execSync(cmd, { timeout: 30000, encoding: "utf-8" });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
```

### 3. Add `installInfo` to `PluginSummary` type

In `src/lib/types.ts`, add to both interfaces:

```typescript
export interface PluginSummary {
  // ... existing fields ...
  installInfo?: {
    isInstalled: boolean;
    isEnabled: boolean;
    cliName: string;
  };
}
```

### 4. Wire install state into data loading

In `src/lib/marketplace-loader.ts`, after building each `PluginSummary` in `loadPluginFromDir()`, attach install info:

```typescript
import { getInstallState } from "./install-state";

// Inside loadPluginFromDir, before the return:
const installInfo = getInstallState(name, marketplaceId);

return {
  // ... existing fields ...
  installInfo: {
    isInstalled: installInfo.isInstalled,
    isEnabled: installInfo.isEnabled,
    cliName: installInfo.cliName,
  },
};
```

### 5. Update PluginCard with install status indicator

In `src/components/PluginCard.tsx`, add a small install status dot/badge. Keep it subtle — a small green dot for installed+enabled, amber for installed+disabled, nothing for not installed:

```tsx
{plugin.installInfo?.isInstalled && (
  <span
    className={`ml-auto h-2 w-2 rounded-full ${
      plugin.installInfo.isEnabled ? "bg-green-500" : "bg-amber-500"
    }`}
    title={plugin.installInfo.isEnabled ? "Installed & enabled" : "Installed but disabled"}
  />
)}
```

Add this inside the existing feature icons row (`<div className="mt-auto flex items-center gap-3 text-xs">`), before the symlink indicator.

### 6. Update PluginDetail with install/manage controls

Replace the install command section (`PluginDetail.tsx:109-115`) with an interactive section. This component is already `"use client"` so it can have state and event handlers.

The section should show:
- **If not installed:** An "Install" button + the correct CLI command for reference
- **If installed + enabled:** "Uninstall" and "Disable" buttons
- **If installed + disabled:** "Uninstall" and "Enable" buttons

Use `fetch("/api/plugins", { method: "POST", body: JSON.stringify({ action, cliName }) })` to call the API routes. After a successful action, use `router.refresh()` from `next/navigation` to reload the page with fresh server data.

Also fix the install command display to show the correct syntax:
```
claude plugin install <cliName>
```
instead of `claude --plugin-dir <path>`.

### 7. Styling guidance

Match the existing dark theme:
- Buttons: `rounded-lg px-4 py-2 text-sm font-medium`
- Install (primary): `bg-blue-600 hover:bg-blue-500 text-white`
- Uninstall (danger): `bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30`
- Enable/Disable (secondary): `bg-zinc-800 hover:bg-zinc-700 text-zinc-300`
- Loading state: disable button + show "Installing..." / "Removing..." text
- Command display: keep the existing `<pre>` styling but fix the command text

## Constraints

- This runs locally only — no auth needed on the API routes
- Use `execSync` for simplicity (these operations are fast)
- Don't add any new dependencies
- Keep the marketplace ID → CLI name mapping in one place (`install-state.ts`)
- The `installed_plugins.json` format has `{ "version": 2, "plugins": { ... } }` — make sure to access `.plugins`
