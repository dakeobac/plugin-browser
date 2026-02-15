# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server at localhost:3000
- `npm run build` — production build
- `npm start` — production server
- No test/lint scripts configured yet

## Architecture

- Next.js 16 App Router with React 19, TypeScript 5, Tailwind CSS 4
- Dark-themed plugin marketplace UI for browsing Claude Code plugins
- Server components load data from filesystem; client components handle interactivity
- Path alias: `@/*` → `./src/*`

## Data Flow

- `marketplace.config.ts` defines 4 marketplace sources with filesystem paths
- `marketplace-loader.ts` reads `.claude-plugin/marketplace.json` manifests and plugin directories
- `plugin-parser.ts` extracts full details (README, commands, skills, agents)
- `install-state.ts` checks `~/.claude/plugins/installed_plugins.json` and `~/.claude/settings.json`
- Pages use `force-dynamic` for fresh data on each request

## Key Directories

- `src/app/` — Pages and API routes (App Router)
- `src/app/api/plugins/route.ts` — POST endpoint for install/uninstall/enable/disable via claude CLI
- `src/components/` — All client components (PluginGrid, PluginCard, PluginDetail, MarketplaceTabs, SearchBar)
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

## Conventions

- All interactive components use `"use client"` directive
- Category colors defined in `PluginCard.tsx` (11 categories)
- Markdown rendering uses `react-markdown` with `.prose-dark` CSS class in `globals.css`
- `marketplace.config.ts` paths are hardcoded to local filesystem (must be updated per machine)
