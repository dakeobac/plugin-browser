# Torchlit Archive — Design System Handoff Brief

> Self-contained reference for building a cross-project Glintlock design system plugin. Extracted from glintlock-web (the source of truth). An agent with zero Glintlock context can build from this alone.

---

## Overview

**Name:** Torchlit Archive
**Aesthetic:** Deep navy stone, warm firelight, editorial precision.
**Origin:** glintlock-web — a Next.js marketing site + MDX blog at glintlock.gg

The design system spans four surfaces:

| Surface | Tech | Visual rendering? |
|---------|------|-------------------|
| **glintlock-web** | Next.js, Tailwind, CSS modules | Full visual |
| **Tauri game app** | Tauri + web frontend | Full visual |
| **Claude Code plugin** | Markdown + terminal | Text only — brand voice + terminology |
| **OpenCode plugin** | Markdown + terminal | Text only — brand voice + terminology |

---

## 1. Design Tokens

### 1.1 Colors — Surface Hierarchy (Deep Navy Stone)

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#080a0f` | Page/app background |
| `--surface-2` | `#12151e` | Elevated panels, modals, code blocks |
| `--surface-3` | `#161a24` | Cards |
| `--surface-4` | `#1a1f2a` | Card hover / active states |

### 1.2 Colors — Text Hierarchy (Warm Parchment Tones)

| Token | Hex | Usage |
|-------|-----|-------|
| `--foreground` / `--text` | `#e2ddd5` | Primary text |
| `--text-secondary` | `#b0aaa2` | Secondary text, narrative prose body |
| `--text-muted` | `#7a7680` | Muted text, timestamps, labels |
| `--text-dim` | `#4e4b55` | Barely visible text, terminal comments |

### 1.3 Colors — Brand (Warm Firelight Orange)

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#d4622a` | Links, CTAs, accents, cursor blink |
| `--primary-bright` | `#e8773a` | Hover states on primary elements |
| `--primary-soft` | `rgba(212, 98, 42, 0.1)` | Subtle accent backgrounds (step numbers, badges) |
| `primary-foreground` | `#080a0f` | Text on primary backgrounds (Tailwind alias only) |

### 1.4 Colors — Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#1c2030` | Default borders, card grids (gap trick), dividers |
| `--border-light` | `#252a3a` | Hover borders, subtle dividers, underline decoration |

### 1.5 Colors — Status & Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#3ddc84` | Success states, dice roll results, badge pulse dot |
| `--discord` | `#5865F2` | Discord brand color |
| `--discord-soft` | `rgba(88, 101, 242, 0.12)` | Discord subtle background |
| `--eye-glow` | `#f5a63e` | Mascot eye glow effect |

### 1.6 Colors — Terminal Chrome

| Token | Hex | Usage |
|-------|-----|-------|
| `--terminal-bg` | `#0c0e14` | Terminal body background |
| `--terminal-border` | `#1e2230` | Terminal border and dividers |
| `--terminal-header` | `#151820` | Terminal header/title bar background |

### 1.7 Colors — Traffic Light Dots (macOS Window Chrome)

| Dot | Hex |
|-----|-----|
| Red | `#ff5f57` |
| Yellow | `#ffbd2e` |
| Green | `#28c840` |

### 1.8 Colors — Mascot Palette

| Element | Colors |
|---------|--------|
| Cloak gradient | `#4a3d5e` → `#2a2035` |
| Eye gradient | `#fde4a0` → `#f5a63e` → `#f0922a` |
| Torch light | `#f5a63e` (50% opacity) → `#d4622a` (0% opacity) |
| Face | `#eae5dc` (primary), `#d5cfc5` (shadow), `#f0ece5` (highlight) |
| Eye sockets | `#1a1525` |
| Eye specular | `#fde4a0` |
| Nose/mouth | `#c4bdb3` |
| Cloak stroke | `#352d42` |
| Flame layers | `#d4622a` → `#e8873a` → `#f5b844` → `#fde4a0` → `#fff` (core) |
| Torch wood | `#5c4a35` (outer), `#4a3a28` (inner), `#6b5840` (notches) |
| Gem body | `#d4622a` (fill), `#a84a1c` (stroke), `#f5a63e` (inner), `#fde4a0` (specular) |
| Paw pads | `#d5cfc5` |
| Feet shadows | `#1a1525` |

---

## 2. Typography

### 2.1 Font Stack

| Font | CSS Variable | Role | Weights | Styles |
|------|-------------|------|---------|--------|
| **Cinzel** | `--font-display` | Headings — "chiseled in stone" feel | 400, 500, 600, 700 | normal |
| **Crimson Pro** | `--font-narrative` | Narrative prose — "inked on vellum" feel | 300, 400, 500, 600 | normal, italic |
| **DM Sans** | `--font-body` | UI body text — clean and readable | 300, 400, 500, 600, 700 | normal, italic |
| **JetBrains Mono** | `--font-mono` | Code, terminal, data, badges | 400, 500 | normal |

### 2.2 Tailwind Aliases

```js
fontFamily: {
  sans: ['var(--font-body)', 'system-ui', 'sans-serif'],   // DM Sans
  display: ['var(--font-display)', 'serif'],                 // Cinzel
  mono: ['var(--font-mono)', 'monospace'],                   // JetBrains Mono
}
```

Note: Crimson Pro has no Tailwind alias — it's applied via the `.font-narrative` CSS class in `globals.css`.

### 2.3 Typography Rules

- `h1`, `h2`, `h3` automatically inherit `font-display` (Cinzel) + `letter-spacing: 0.02em` + `font-weight: 600` via global CSS
- Body text defaults to `font-body` (DM Sans) + `line-height: 1.6`
- Narrative/prose sections use `.font-narrative` class: `font-weight: 300`, `line-height: 1.75`
- Mono text (`.font-mono`) for code, stats, system info
- All fonts loaded via `next/font/google` with `display: 'swap'` — self-hosted, GDPR compliant, no external requests

### 2.4 Type Scale (Landing Page)

| Element | Font | Size | Weight | Other |
|---------|------|------|--------|-------|
| Hero title | Cinzel | `clamp(30px, 5vw, 44px)` | 600 | `letter-spacing: 0.04em` |
| Hero tagline | DM Sans | 14px | 500 | `letter-spacing: 0.15em`, uppercase, primary color |
| Hero description | Crimson Pro | 17px | 300 | `line-height: 1.75`, text-secondary color |
| Section heading | Cinzel | 20px | 600 | `letter-spacing: 0.03em` |
| Feature card title | Cinzel | 14px | 600 | `letter-spacing: 0.03em` |
| Feature card body | DM Sans | 13px | 400 | `line-height: 1.65`, text-muted color |
| Badge/tag | JetBrains Mono | 10-11px | 500-700 | `letter-spacing: 0.02-0.05em`, uppercase |
| Terminal body | JetBrains Mono | 13px | — | `line-height: 1.8` |
| Terminal title | JetBrains Mono | 11-12px | — | text-dim color |
| CTA heading | Crimson Pro | `clamp(18px, 3vw, 24px)` | 400 | italic, `letter-spacing: 0.01em` |
| FAQ question | Cinzel | 15px | 600 | `letter-spacing: 0.02em` |
| FAQ answer | DM Sans | 13.5px | 400 | `line-height: 1.65`, text-muted |
| Capability label | DM Sans | 11px | 600 | uppercase, `letter-spacing: 0.1em`, text-dim |
| Capability pill | DM Sans | 12px | 500 | text-muted |

---

## 3. Spacing & Layout

### 3.1 Radii

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| `rounded-sm` | `--radius-sm` | `6px` | Small elements, buttons, default (`*` rule) |
| `rounded` | `--radius` | `8px` | Default explicit radius, scrollbar thumb |
| `rounded-lg` | `--radius-lg` | `12px` | Terminal chrome, card grids, step cards |

Global rule: `* { border-radius: var(--radius-sm); }` — everything gets 6px by default.

### 3.2 Container

| Property | Value |
|----------|-------|
| Max width | `880px` |
| Horizontal padding | `28px` (`px-7`) — reduces to `20px` on mobile |
| Centering | `margin: 0 auto` |

### 3.3 Page Layout

| Property | Value |
|----------|-------|
| Nav height | `60px` |
| Top padding (inner pages) | `128px` (`pt-32`) — accounts for fixed nav |
| Bottom padding | `64px` (`pb-16`) |
| Section padding | `56px 0 72px` (typical), `72px 0` (hero/CTA) |

### 3.4 Card Grid Gap Trick

Card grids use a `2px` gap with `background: var(--border)` on the parent container, and `background: var(--surface-3)` on child cards. This creates thin border lines between cards without actual borders. The parent gets `border-radius: var(--radius-lg)` + `overflow: hidden`.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* or 2, or 4 */
  gap: 2px;
  background: var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.card {
  background: var(--surface-3);
  padding: 24-30px;
}
```

---

## 4. Component Patterns

### 4.1 Terminal Chrome (macOS Window)

The primary interactive component. Used for install commands and session mockups.

**Structure:**
```
┌─ terminal-header ──────────────────────────────────────┐
│  [●] [●] [●]   title text          [Tab A] [Tab B]    │
├────────────────────────────────────────────────────────┤
│  terminal-body                                          │
│  # comment text                                         │
│  $ command text                                         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: `--terminal-bg` (`#0c0e14`)
- Border: `1px solid --terminal-border` (`#1e2230`)
- Radius: `--radius-lg` (12px)
- Header: `--terminal-header` (`#151820`) with bottom border
- Traffic dots: 10x10px circles, 6px gap
- Title: mono font, 11-12px, text-dim color
- Body: mono font, 13px, `line-height: 1.8`, `padding: 16-20px`
- Shadow: `0 8px 40px rgba(0,0,0,0.4), 0 0 80px rgba(212,98,42,0.03)`
- Hover shadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 100px rgba(212,98,42,0.06)`

**Tabbed variant (segmented control in header):**
- Tabs container: `background: var(--surface-3)`, `border-radius: 6px`, `padding: 2px`
- Active indicator: absolute-positioned slider, `background: var(--surface-4)`, `border: 1px solid var(--border-light)`, `border-radius: 4px`
- Slider transition: `250ms cubic-bezier(0.4, 0, 0.2, 1)`
- Tab text: mono font, 11px, weight 500, text-dim → text color on active
- Content crossfade: `fadeInContent 200ms ease both` on platform switch

### 4.2 Section Heading

Chevron prefix + Cinzel heading. Used consistently for all content sections.

```html
<div class="sectionHeading">
  <span class="sectionChevron">›</span>
  <h2>Section Title</h2>
</div>
```

- Chevron: `›` character, primary color, 18px, weight 600
- Heading: Cinzel, 20px, weight 600, `letter-spacing: 0.03em`
- Gap: 10px, flex aligned center
- Margin bottom: 20px

### 4.3 Card Grid (Benefits)

3-column grid (collapses to 1 on mobile) with the gap-border trick.

**Card styling:**
- Background: `--surface-3` → `--surface-4` on hover
- Padding: `30px 24px`
- Left border: `3px solid transparent` → `--primary` on hover
- Icon: 32x32 container, primary color, scales 1.1x on hover with `drop-shadow(0 0 6px rgba(212,98,42,0.4))`
- Title: Cinzel, 14px, weight 600
- Body: DM Sans, 13px, text-muted color

### 4.4 Capability Grid

2-column grid (collapses to 1 on mobile) with gap-border trick.

- Category label: DM Sans, 11px, weight 600, uppercase, `letter-spacing: 0.1em`, text-dim
- Pills: DM Sans, 12px, weight 500, text-muted, `background: var(--surface-2)`, `border: 1px solid var(--border)`, `border-radius: 14px`, `padding: 5px 12px`

### 4.5 Step Cards (Get Started / Walkthrough)

Vertical stack of cards with numbered steps.

- Card: `background: var(--surface-3)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, `padding: 20px 24px`
- Step number: 28x28 circle, `background: var(--primary-soft)`, `color: var(--primary)`, mono font, 13px, weight 600
- On parent hover: step number transitions to `background: var(--primary)`, `color: #fff`
- Title: Cinzel, 14px, weight 600
- Body: DM Sans, 13px, text-muted, `line-height: 1.5`
- Inline code: mono font, 12px, `background: rgba(255,255,255,0.06)`, `padding: 2px 8px`, `border-radius: 4px`, text-secondary

### 4.6 Badge / Pill

```html
<span class="badge">
  <span class="badgeDot"></span>  <!-- optional pulsing dot -->
  Badge Text
</span>
```

- Container: DM Sans, 11px, weight 500, text-muted, `background: var(--surface-3)`, `border: 1px solid var(--border)`, `padding: 5px 12px`, `border-radius: 14px`
- Pulsing dot: 6px circle, `--success` color, `badgePulse 2s ease-in-out infinite`
- Accent variant: `border-color: var(--primary-soft)`, `color: var(--text-secondary)`

### 4.7 NEW Pill (Announcement Banner)

Inline-flex link with embedded tag + arrow.

- Container: `background: var(--surface-3)`, `border: 1px solid var(--border)`, `border-radius: 20px`, `padding: 6px 16px 6px 8px`, 12px text, text-muted
- Tag: `background: var(--primary)`, white text, 10px, weight 700, `letter-spacing: 0.05em`, `border-radius: 10px`, `padding: 2px 7px`
- Arrow: `→` character, translates 3px right on hover

### 4.8 Button — Primary CTA (Install Button in Nav)

```
bg-primary px-5 py-[7px] rounded-sm text-[13px] text-white font-medium
```

**Gradient shimmer effect:**
- `before:` pseudo-element with `linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)`
- Background size: 250%
- Resting position: `200% 0` (shimmer hidden off-right)
- Hover: slides to `-100% 0` over `1500ms`

**Glow shadow on hover:**
- `box-shadow: 0 0 20px rgba(212,98,42,0.35)`

### 4.9 Glass Backdrop (SiteNav)

Fixed top nav with conditional scroll styling.

**Default (top of page):** transparent background, transparent border.

**Scrolled (> 32px):**
- `background: rgba(8, 10, 15, 0.88)`
- `backdrop-filter: blur(20px)`
- `border-bottom: 1px solid var(--border)`
- `box-shadow: 0 1px 12px rgba(0,0,0,0.3)`
- Transition: `all 300ms`

### 4.10 FAQ List

No-grid layout — stacked items with border separators.

- Item: `padding: 20px 0`, `border-bottom: 1px solid var(--border)`
- First item: no top padding. Last item: no bottom border.
- Question: Cinzel, 15px, weight 600, text color
- Answer: DM Sans, 13.5px, weight 400, text-muted, `line-height: 1.65`

### 4.11 CTA Box

Centered box with subtle radial glow.

- Box: `background: var(--surface-2)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, `padding: 48px 40px`
- Glow: 400x400 radial gradient of `--primary`, `opacity: 0.03`, positioned above center
- Heading: Crimson Pro, italic, `clamp(18px, 3vw, 24px)`, weight 400
- Description: DM Sans, 14px, text-muted, `line-height: 1.6`

### 4.12 Prose Styling (Blog/Content Pages)

Full Tailwind Typography customization for markdown content:

```
prose prose-invert max-w-prose
  prose-headings:font-display prose-headings:font-normal
  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
  prose-code:text-primary prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5
    prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-surface-2 prose-pre:border prose-pre:border-border
```

### 4.13 Footer

Centered, minimal.

- Link nav: flex-wrap row with `·` separators, 13px text, `text-muted-foreground`, hover → `text-primary`
- Tagline: 13px, text-muted-foreground
- Copyright: 11px, text-muted-foreground at 50% opacity

### 4.14 Inner Page Skeleton

Every non-landing page follows this template:

```tsx
<div className="min-h-screen bg-background text-foreground">
  <SiteNav />
  <article className="pt-32 pb-16 px-7">
    <div className="max-w-[880px] mx-auto">
      {/* Category badge: 10px, uppercase, mono, tracking-wider, primary on surface-2 */}
      <span className="text-[10px] px-2 py-1 tracking-wider uppercase font-mono text-primary bg-surface-2 inline-block mb-6">
        {category}
      </span>
      {/* Title: Cinzel, clamp(28px,5vw,40px), font-normal */}
      <h1 className="text-[clamp(28px,5vw,40px)] mb-8 leading-tight font-display font-normal">
        {title}
      </h1>
      {/* Content */}
      {/* Back link: 13px, text-muted, hover → foreground */}
      <div className="mt-12">
        <Link href="/">← Back to Home</Link>
      </div>
    </div>
  </article>
  <SiteFooter />
</div>
```

---

## 5. Noise Texture Overlay

Applied globally via `body::before` in globals.css.

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.018;    /* 1.8% — barely visible parchment grain */
  background-image: url("data:image/svg+xml,...");  /* SVG fractalNoise */
  background-size: 180px;
}
```

The SVG contains `<feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/>`.

Full data URI:
```
data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E
```

---

## 6. Animation System

### 6.1 Keyframe Definitions

**UI Animations:**

| Name | Keyframes | Duration | Easing | Use |
|------|-----------|----------|--------|-----|
| `fadeUp` | `opacity: 0, translateY(20px)` → `opacity: 1, translateY(0)` | 0.7s | ease | Hero staggered entrance |
| `fadeIn` | `opacity: 0` → `opacity: 1` | 0.6s | ease | Mascot entrance |
| `fadeInContent` | `opacity: 0, translateY(4px)` → `opacity: 1, translateY(0)` | 200ms | ease | Tab content crossfade |
| `cursorBlink` | `opacity: 1` → `0` → `1` (step-end) | 1.2s | step-end | Terminal cursor |
| `badgePulse` | `opacity: 1` → `0.4` → `1` | 2s | ease-in-out | Badge status dot |
| `flickerGlow` | `opacity: 0.07` → `0.05` → `0.09` → `0.04` → `0.07` | 6s | ease-in-out | Hero background glow |

**Mascot Animations:**

| Name | Keyframes | Duration | Easing | Use |
|------|-----------|----------|--------|-----|
| `mascotFloat` | `translateY(0)` → `translateY(-8px)` → `translateY(0)` | 4s | ease-in-out | Mascot gentle bob |
| `flameFlicker1` | scaleY/scaleX variations (0.94-1.1), opacity 0.7-0.9 | 1.2s | ease-in-out | Outer flame layer |
| `flameFlicker2` | scaleY/scaleX variations (0.93-1.08), opacity 0.8-0.95 | 0.9s | ease-in-out | Middle flame layer |
| `flameFlicker3` | scaleY variations (0.92-1.1), opacity 0.85-1.0 | 0.7s | ease-in-out | Inner flame layer |
| `eyeGlow` | drop-shadow intensity oscillation (3px/8px → 5px/14px) | 3s | ease-in-out | Eye glow pulse |
| `torchAmbient` | opacity 0.18-0.3 random | 1.5s | ease-in-out | Ambient torch light |
| `sparkle` | `opacity: 1, translateY(0), scale(1)` → `opacity: 0, translateY(-18px), scale(0.3)` | 1.1-1.8s | ease-out | Spark particles (staggered) |

**Spark stagger delays:** spark1: 0s, spark2: 0.3s, spark3: 0.7s

**Mascot hover interactions:**
- Wrapper: `scale(1.08)` on hover
- SVG wrap: adds `drop-shadow(0 0 20px rgba(212,98,42,0.35))` on hover
- Flame layers: `animation-duration: 0.6s !important` on hover (faster flicker)
- Eye glow: `brightness(1.3)` on hover

### 6.2 Hero Staggered Entrance

Elements animate in sequence using `fadeUp` with increasing delays:

| Element | Delay |
|---------|-------|
| Mascot | 0.1s (fadeIn) |
| NEW pill | 0.15s |
| Title | 0.2s |
| Tagline | 0.3s |
| Description | 0.4s |
| Sub-description | 0.45s |
| Install block | 0.55s |
| Badges | 0.7s |

All use `opacity: 0` initial + `animation: fadeUp 0.7s ease [delay] forwards`.

### 6.3 Scroll Reveal System

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

Stagger delay classes: `.d1` through `.d6` (0.05s increments, 0.05s to 0.3s).

**IntersectionObserver config:**
```js
{
  threshold: 0.12,
  rootMargin: '0px 0px -30px 0px'
}
```

Elements get `.visible` added when 12% visible. Observer unobserves after triggering (one-shot).

---

## 7. Scrollbar

```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--background); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: var(--radius); }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
```

---

## 8. Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| `≤768px` | Container padding → 20px. Hero padding → 100px top 40px bottom. Mascot → 90x108. Features grid → 1col. Capabilities grid → 1col. Get Started links → 2col. CTA box padding → 40px 24px. Terminal title hidden. Tab font → 10px. |
| `≤400px` | Tab icons hidden. |

---

## 9. Brand Voice Guidelines

### 9.1 Tone

- **Direct, confident, atmospheric.** Short sentences. No filler.
- Second person present tense in game context: "You press against the wall."
- Headings are declarative, not interrogative: "Every roll satisfies" not "Do rolls matter?"
- CTA style: evocative, not salesy. "A torch burning in the dark, and someone brave enough to carry it."
- Never use emoji in any surface.

### 9.2 Heading Style

- Section headings: imperative/declarative fragments — "Why It Works", "Built In", "Your First Five Minutes", "Before You Begin"
- Heading prefix: `›` chevron in primary color before section titles

### 9.3 Terminal Voice

- Comments: `# Clone the repo` — terse, lowercase, instructional
- Prompt: `$` for shell commands, `you ›` for player input
- GM narration: Crimson Pro italic in the session mockup — atmospheric, second person
- System text: mono, dim color, italicized for asides like "(Kael nearly drowned in the Wethall Mines)"

### 9.4 Terminology Conventions

These terms define the Torchlit Archive vocabulary:

| Internal term | What it describes |
|---------------|-------------------|
| "Torchlit Archive" | The design system itself |
| "deep navy stone" | The dark background surface family |
| "warm firelight" / "firelight orange" | The primary accent color |
| "warm parchment tones" | The text color family |
| "chiseled in stone" | Cinzel heading aesthetic |
| "inked on vellum" | Crimson Pro narrative aesthetic |
| "atmospheric, not clinical" | Guiding principle for radii and spacing |

### 9.5 IP-Safe Content Rules

When any surface describes Glintlock's game system:

**Use:** "influenced by," "learns from," "in the tradition of," "builds on ideas from"
**Never use:** "compatible with," "based on," "derived from," "a hack of," "supplement for"

**Original terminology — always use these, never D&D equivalents:**
- Stats: Vigor, Reflex, Wits, Resolve, Presence, Lore
- Classes: Warden, Scout, Invoker, Surgeon, Rogue, Seer
- Escalation: Doom, Portent
- Health: Vitality, Guard, Check, Charge, Breather, Camp

---

## 10. Per-Platform Implementation Notes

### 10.1 Next.js (glintlock-web) — Already Implemented

- CSS variables defined in `globals.css`, mapped to Tailwind in `tailwind.config.js`
- Fonts loaded via `next/font/google` (self-hosted, GDPR compliant)
- Landing page uses CSS modules for animations; inner pages use Tailwind utilities
- `@tailwindcss/typography` plugin for prose styling
- No design changes needed — this IS the source of truth

### 10.2 Tauri Game App — Webview Frontend

- **Fonts:** Bundle `.woff2` files locally (don't use next/font or CDN). All four fonts available from Google Fonts.
- **CSS variables:** Port the `:root` block directly — all tokens work in any CSS context.
- **Noise texture:** The SVG data URI works in any browser/webview.
- **IntersectionObserver:** Works in Tauri's webview (Chromium-based).
- **Terminal chrome:** The session mockup pattern translates directly — it's the core game UI.
- **Titlebar:** Consider whether to use native OS titlebar or custom. The macOS traffic light dots pattern already exists in the design system.
- **Scrollbar:** WebKit scrollbar styles work in Tauri's webview.

### 10.3 Claude Code Plugin — Text Only

No visual rendering. The design system applies to:
- **Brand voice** in skill descriptions, command help text, and generated content
- **Terminology** consistency (original game terms, not D&D terms)
- **Tone** — direct, atmospheric, no emoji
- **Section heading convention** — `›` prefix for structured output

### 10.4 OpenCode Plugin — Text Only

Same as Claude Code plugin. Ensure identical brand voice and terminology across both.

---

## 11. Source Files (Cross-Reference)

These are the canonical source files in the glintlock-web repo:

| File | What it contains |
|------|-----------------|
| `src/app/globals.css` | All CSS custom properties (tokens), base reset, typography rules, noise texture, scrollbar, scroll reveal system, all keyframe animations, animation utility classes |
| `tailwind.config.js` | Tailwind theme extensions mapping CSS variables to utility classes |
| `src/app/page.module.css` | All landing page component styles — terminal chrome, cards, sections, badges, responsive breakpoints |
| `src/app/LandingPage.tsx` | Landing page component implementations — mascot SVG (full markup), install block, mini audio player, benefits/walkthrough/capabilities/FAQ data, IntersectionObserver setup |
| `src/app/layout.tsx` | Font loading configuration (weights, styles, CSS variables), global metadata |
| `src/components/SiteNav.tsx` | Fixed nav with glass backdrop, logo, GitHub/Discord icons, Install CTA button with shimmer effect |
| `src/components/SiteFooter.tsx` | Centered footer with link nav and copyright |
| `src/components/NavLogo.tsx` | 32x32 mascot icon SVG |
| `plugins/glintlock-site/skills/torchlit-archive/SKILL.md` | Existing design system skill documentation (subset of this brief) |

---

## 12. What the Plugin Should Provide

The design system plugin should expose:

1. **A `torchlit-archive` skill** — comprehensive design token reference (this document, condensed for plugin context size)
2. **A `brand-voice` skill** — tone, terminology, IP safety rules
3. **Per-platform implementation guides** — as referenced skills or command output
4. **A `design-audit` command** — checks a project's CSS/markup against the token spec (colors match, fonts correct, spacing consistent)
5. **A `token-export` command** — generates a CSS variables file, Tailwind config snippet, or JSON tokens for a target platform

The plugin should be installable across all four Glintlock projects and provide contextually appropriate guidance based on the project type it detects.
