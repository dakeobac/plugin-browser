# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server at localhost:3000
- `npm run build` — production build
- `npm start` — production server
- No test/lint scripts configured yet

## Architecture

- **Engram** — Agent workbench for Claude Code and OpenCode
- Next.js 16 App Router with React 19, TypeScript 5, Tailwind CSS 4
- Server components load data from filesystem + SQLite; client components handle interactivity
- Path alias: `@/*` → `./src/*`
- Homepage (`/`) is the `EngramDashboard` — command box, stats, agents, teams, activity feed
- Navigation uses grouped dropdowns: Dashboard, Workbench (Agents/Chat/Teams/Workflows), Marketplace (Browse/Discover/Ecosystem/Connectors), Observatory

## Data Flow

- `marketplace.config.ts` defines 4 marketplace sources with filesystem paths
- `marketplace-loader.ts` reads `.claude-plugin/marketplace.json` manifests and plugin directories
- `plugin-parser.ts` extracts full details (README, commands, skills, agents)
- `install-state.ts` checks `~/.claude/plugins/installed_plugins.json` and `~/.claude/settings.json`
- Pages use `force-dynamic` for fresh data on each request

## Key Directories

- `src/app/` — Pages and API routes (App Router)
- `src/app/api/plugins/route.ts` — POST endpoint for install/uninstall/enable/disable via claude CLI
- `src/components/` — All client components (EngramDashboard, CommandBox, StatStrip, ActiveAgentsPanel, QuickLaunchPanel, NavDropdown, RuntimeBadge, PluginGrid, PluginCard, PluginDetail, etc.)
- `src/lib/` — Server-side utilities (types, marketplace-loader, plugin-parser, install-state)

## Plugin Data Model

- `PluginSummary`: name, description, version, category, author, marketplace, slug, feature flags/counts, installInfo
- `PluginDetail` extends `PluginSummary` with readme, commands[], skills[], agents[]
- Slug format: `{marketplace}--{plugin-name}`

## Marketplace ID Mapping

Browser marketplace IDs map to CLI marketplace names:

- `personal` → `claude-plugins`
- `local` → `local`
- `official` → `claude-code-plugins`
- `community` → `claude-plugins-official`

## Git Workflow

Agreed with collaborator Jet (gcoulby). Follow this for all work in this repo.

1. Always work on the `develop` branch — never push to `main` directly
2. Before starting any task, create a GitHub issue/ticket first
3. Create a feature branch from `develop` named after the ticket (e.g. `feature/12-add-search`)
4. When work is done, open a PR from the feature branch into `develop`
5. Never push directly to `develop` or `main` — always use PRs
6. If a branch goes off track or the output is bad, just delete it — this is a feature, not a failure. Branches are cheap checkpoints for AI-generated code.
7. After merging a PR, delete the feature branch

## Conventions

- All interactive components use `"use client"` directive
- Category colors defined in `PluginCard.tsx` (11 categories)
- Markdown rendering uses `react-markdown` with `.prose-dark` CSS class in `globals.css`
- `marketplace.config.ts` paths are hardcoded to local filesystem (must be updated per machine)
