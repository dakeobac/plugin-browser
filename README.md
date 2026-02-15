# Plugin Browser

A Next.js web app for browsing, discovering, creating, and managing Claude Code plugins across multiple marketplace sources.

## Features

- **Marketplace Browser** — Browse plugins across 4 sources (personal, local, official, community) with search and filtering
- **Plugin Factory** — Scan installed plugins, detect patterns, get AI-powered suggestions, and scaffold new plugins
- **Agent Mode** — Chat interface for Claude Code and OpenCode with session management
- **Home Dashboard** — Installed plugins overview with stats, quick links, and plugin frontends
- **Wiki** — Reference documentation for plugin development topics

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Commands

- `npm run dev` — Development server
- `npm run build` — Production build
- `npm start` — Production server

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4

## Branching Workflow

- **`main`** — Stable/production branch. Protected; only receives merges via PR.
- **`develop`** — Default working branch. Day-to-day development happens here.
- **Feature branches** — Branch off `develop`, merge back via PR.
