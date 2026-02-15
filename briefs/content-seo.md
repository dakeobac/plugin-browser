# Content SEO — AI-Powered SEO Content Engine

> A general-purpose Claude Code plugin that turns target keywords into published, search-optimized articles. Replaces paid content SEO tools by combining SERP research, content brief generation, optimized writing, and automated on-page optimization — all powered by Claude and real Google Search Console data.

---

## What This Plugin Does

Content SEO is installed into any website project and bootstraps itself to understand your framework, content directories, brand voice, and audience. It provides a complete content workflow:

**Keyword → Research → Brief → Write → Optimize → Audit**

The plugin automates what SEO agencies charge $200-500+ per article for: researching search intent, analyzing competing content, creating a data-driven outline, writing optimized copy, and verifying on-page SEO quality.

It works with any static site generator or web framework (Next.js, Astro, Hugo, Gatsby, WordPress, plain HTML) and writes content in the correct format for your project (MDX, Markdown, HTML).

---

## Commands

### `/init` command
**Bootstrap setup wizard.** Detects the project framework, finds content directories, asks about brand voice and target audience, checks for existing GSC credentials. Creates `.claude/content-seo.local.md` with all project-specific configuration.

Detection targets:
- **Framework**: package.json (Next.js, Astro, Gatsby, Nuxt, SvelteKit), config files (hugo.toml, _config.yml), WordPress (wp-content/)
- **Content dirs**: src/content/, content/, posts/, _posts/, blog/, src/app/blog/, pages/blog/
- **Frontmatter format**: MDX, Markdown, YAML, TOML
- **Existing SEO setup**: sitemap, robots.txt, meta tags, JSON-LD, GSC verification

Writes `.claude/content-seo.local.md`:
```yaml
---
enabled: true
site_url: ""
content_dir: ""
framework: ""
frontmatter_format: mdx
brand_voice: ""
target_audience: ""
gsc_property: ""
gsc_service_account_path: ""
min_word_count: 1500
internal_link_domains: []
---
```

Should use AskUserQuestion for brand voice, audience, and site URL — these can't be auto-detected.

### `/research` command
**Keyword research and opportunity analysis.** Accepts a seed keyword or topic. Combines GSC data (if connected) with web search to find keyword opportunities.

Workflow:
1. Query GSC for related impressions/clicks data (via MCP `searchAnalytics.query`)
2. Web search for "keyword + search volume", "keyword + related searches"
3. Identify clusters: informational, transactional, navigational intent
4. Score opportunities by: search volume signals, current ranking position (if in GSC), competition indicators
5. Output a ranked keyword opportunity table with intent labels and recommended content type (blog post, landing page, FAQ, comparison)

Allowed tools: Read, Glob, Grep, Bash(curl:*), WebSearch, MCP tools

### `/brief` command
**SERP-driven content brief generation.** Accepts a target keyword. Researches what currently ranks, analyzes content structure, and generates a comprehensive brief.

Workflow:
1. Web search the target keyword
2. Analyze top 5-10 results: headings, word count estimates, content type, unique angles
3. Determine primary search intent (informational, commercial, transactional, navigational)
4. Identify required entities/topics to cover (semantic SEO)
5. Read `.claude/content-seo.local.md` for brand voice and audience
6. Generate brief containing:
   - Target keyword + secondary keywords
   - Search intent classification
   - Recommended title (with keyword positioning)
   - Meta description template
   - H2/H3 heading outline with word count targets per section
   - Required topics/entities to cover
   - Internal linking opportunities (scan existing content)
   - Suggested FAQ section questions
   - Competitor gap: what top results miss that we can cover
   - Target word count range

Allowed tools: Read, Glob, Grep, WebSearch, WebFetch

### `/write` command
**Write SEO-optimized content from a brief.** Accepts a topic/keyword (runs `/brief` internally if no brief exists) and writes a complete article directly into the project.

Workflow:
1. Load project config from `.claude/content-seo.local.md`
2. Generate or load content brief
3. Write the article following the brief structure:
   - Title with target keyword in first 60 chars
   - Meta description (120-160 chars, includes keyword, compelling CTA)
   - Proper heading hierarchy (H1 → H2 → H3, no skips)
   - Natural keyword usage (1-2% density, LSI/semantic variants)
   - Internal links to existing content (scan content dir for related posts)
   - External links to authoritative sources
   - FAQ section with schema-ready Q&A
   - Image alt text placeholders with keyword variants
4. Write frontmatter appropriate for the framework:
   - MDX/Markdown: title, description, date, tags, author
   - Generate slug from title
5. Save file to content directory with proper naming convention
6. Generate JSON-LD BlogPosting schema if project uses it
7. Report: file path, word count, keyword density, internal links added, SEO score

Allowed tools: Read, Write, Glob, Grep, WebSearch, WebFetch

### `/optimize` command
**Optimize an existing page for SEO.** Accepts a file path or URL path. Analyzes current content and applies improvements.

Workflow:
1. Read the target file
2. Check GSC data for current performance (impressions, clicks, position, CTR)
3. Analyze current SEO elements:
   - Title tag length and keyword presence
   - Meta description quality
   - Heading hierarchy and keyword usage
   - Word count vs. competing pages
   - Internal link count and relevance
   - External link quality
   - Image alt text coverage
   - Content freshness (date references, outdated info)
4. Generate optimization recommendations with priority (high/medium/low)
5. Ask user which optimizations to apply
6. Apply selected changes directly to the file
7. Report before/after SEO score

Allowed tools: Read, Edit, Glob, Grep, WebSearch, MCP tools

### `/audit-content` command
**Content audit across entire site.** Scans all content files and scores SEO quality. Identifies highest-impact optimization opportunities.

Workflow:
1. Glob content directory for all content files
2. For each file, check:
   - Title present and 50-60 chars
   - Meta description present and 120-160 chars
   - H1 present (exactly one)
   - Word count (flag <500 as thin, <1000 as light)
   - Internal links count (flag 0 as orphaned)
   - Frontmatter completeness
   - Content freshness (last modified date)
3. If GSC connected: cross-reference with search performance data
   - Pages with high impressions but low CTR (title/description problem)
   - Pages with declining clicks (content decay)
   - Pages with no impressions (indexing or relevance problem)
4. Output a sorted table: file path, SEO score (0-100), top issue, recommended action
5. Highlight quick wins: pages where small changes yield big improvements

Allowed tools: Read, Glob, Grep, MCP tools

---

## Skills

- `seo-writing` skill — SEO content writing methodology
- `serp-analysis` skill — SERP analysis and intent classification
- `content-optimization` skill — on-page optimization reference

### `seo-writing` skill
SEO content writing methodology. Covers search intent mapping, E-E-A-T signals, semantic SEO and entity coverage, keyword usage patterns (primary/secondary/LSI), content structure for featured snippets, readability optimization, and internal linking strategy. Reference materials should include title formulas, meta description templates, and heading patterns that rank.

### `serp-analysis` skill
How to analyze search engine results pages. Covers intent classification (informational, commercial, transactional, navigational), SERP feature identification (featured snippets, PAA, knowledge panels, video carousels), competitor content gap analysis, content format matching (listicle vs. guide vs. comparison vs. tutorial), and word count benchmarking.

### `content-optimization` skill
On-page optimization reference. Covers title tag optimization (keyword position, length, CTR triggers), meta description formulas, heading hierarchy best practices, image SEO (alt text, file naming, compression), schema markup patterns (BlogPosting, FAQ, HowTo, Article), Core Web Vitals impact on content, and content freshness signals.

---

## Agents

- `content-researcher` agent — autonomous keyword research and brief generation

### `content-researcher` agent
Autonomous research agent that discovers keyword opportunities and generates content briefs without manual intervention. Triggered when user asks to "research keywords for my site", "find content opportunities", "what should I write about next", or "analyze my content gaps". Uses web search and GSC MCP data to produce prioritized content calendars with full briefs.

---

## MCP Server

Uses the Google Search Console MCP server for real search performance data:

```json
{
  "mcpServers": {
    "gsc": {
      "command": "npx",
      "args": ["-y", "mcp-server-gsc"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${GLINTLOCK_SEO_SERVICE_ACCOUNT_PATH}"
      }
    }
  }
}
```

The `/init` command should check if GSC credentials exist and guide setup if not. The plugin should work without GSC (degraded mode using web search only) but is much more powerful with it.

---

## Hooks

### PostToolUse Hook
After Write or Edit operations on content files, automatically check SEO quality:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if the file written/edited is in the content directory. If so, quickly verify: title length (50-60 chars), meta description (120-160 chars), has H1, word count >500. Report any SEO issues as a brief warning. If file is not content, say nothing."
          }
        ]
      }
    ]
  }
}
```

This enables "SEO guardrails" — automatically catching common mistakes as content is written, without the user having to remember to run an audit.

---

## Per-Project Configuration

Uses `.claude/content-seo.local.md` pattern for project-specific settings:

**YAML frontmatter** (machine-readable):
- `enabled`, `site_url`, `content_dir`, `framework`
- `frontmatter_format`, `brand_voice`, `target_audience`
- `gsc_property`, `gsc_service_account_path`
- `min_word_count`, `internal_link_domains`

**Markdown body** (human-readable, used as context by Claude):
- Brand voice description and examples
- Content guidelines and style rules
- Topic boundaries (what to write about, what to avoid)
- Competitor URLs for gap analysis
- Previously published content themes

The `/init` command creates this file. All other commands read it for context. The file should be gitignored (project-local settings).

---

## Implementation Notes

- Follow Anthropic's progressive disclosure pattern: SKILL.md metadata is concise, core content is 1500-2000 words, reference materials go in `references/` subdirectories
- Commands are written FOR Claude to execute (imperative instructions), not documentation for users
- Use `${CLAUDE_PLUGIN_ROOT}` for all file references in hooks and MCP config
- The plugin should work in degraded mode without GSC (web search only) — GSC adds data but isn't required
- Agent should use 2-3 `<example>` blocks in its description with context/user/assistant/commentary format
- Skills should list specific trigger phrases in their description frontmatter
