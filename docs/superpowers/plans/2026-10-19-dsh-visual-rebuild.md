# DeepSeek Harness Visual Rebuild (Web Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild LangBot's `web/` visual layer to match the DeepSeek Harness (DSH) design language — neutral bluish-gray/charcoal palette, thin low-alpha borders, 8-18px radius scale, SF-Mono code font, near-black brand in light / inverted-white brand in dark, deepseek-blue accents — while leaving backend API, routing, data models, and component logic unchanged. Both light and dark palettes are delivered and wired to the existing ThemeProvider.

**Architecture:** LangBot web is Vite + React 19 + Tailwind v4 (CSS-native, tokens in `web/src/app/global.css`) + shadcn/ui (New York style, `web/src/components/ui/`). DSH's design system lives in 77 `--dsw-*` tokens (44 static palette + 33 alias layer) defined in `@deepseek-ai/dsh-client-ui-theme`. We do NOT pull DSH packages into LangBot (different runtime, license, build). Instead we **transcribe** the DSH token values into LangBot's existing shadcn CSS-variable namespace (`--background`, `--primary`, … under `@theme inline`), and adjust the base UI components that hardcode non-token values (notably the button's `bg-[#2288ee]`) so they follow the tokens. Page-level CSS modules get targeted overrides only where they fight the new look.

**Tech Stack:** React 19, Vite 7, Tailwind v4 (@tailwindcss/postcss), shadcn/ui, pnpm. No new runtime deps.

**Spec:** User request "前端做成 deepseek harness 视觉，后端架构不变" + choices: 1.C (full visual rebuild) + 2.C (light+dark, follow existing ThemeProvider).

## Global Constraints
- Backend (Python Quart, HTTP API, `/mcp`, data layer, routing) is **untouched**. No changes under `src/`, `tests/`, `pyproject.toml`.
- All visual work lives under `web/`. No new dependencies. No route/component-logic changes — className/token changes only.
- Tailwind v4 is CSS-config (no `tailwind.config.js`). All token edits go in `web/src/app/global.css`.
- The existing ThemeProvider (`web/src/components/providers/theme-provider.tsx`) toggles `.light`/`.dark` on `<html>`. Tailwind dark variant is `@custom-variant dark (&:is(.dark *))`. Both palettes must be complete and legible in both modes.
- DSH reference values (transcribed from `@deepseek-ai/dsh-client-ui-theme`, v0.1.5-rc.3):
  - static neutral-bluish: 50 `#f9fafb`, 60 `#f5f6f7`, 75 `#f1f3f5`, 100 `#ebeef2`, 150 `#e9ecf2`, 200 `#e1e5ee`, 300 `#cfd3d6`, 400 `#adb2b8`, 500 `#979da6`, 600 `#81858c`, 700 `#61666b`, 750 `#43454a`, 800 `#353638`, 850 `#2c2c2e`, 875 `#232324`, 900 `#1b1b1c`, 950 `#151517`, 1000 `#0f1115`
  - deepseek: 50 `#edf3fe`, 300 `#b7c8fe`, 400 `#679efe`, 450 `#5686fe`, 500 `#4176e6`, 600 `#4868b2`
  - state: green-500 `#22c55e`, amber-500 `#f59e0b`, red-600 `#ec1313`, red-500 `#ef4444`, red-400 `#f25a5a`
  - alias (light): bg-base/layer-1/2/3 = neutral-bluish-00 `#fff`; bg-module-platform = neutral-bluish-60; border-l1 `#0000000a`, l2 `#0000001a`, l3 `#0000001f`, l4 `#00000029`; brand-primary = neutral-bluish-1000 `#0f1115`; label-primary = neutral-bluish-1000; label-secondary = neutral-bluish-700; label-tertiary = neutral-bluish-600; interactive-bg-hover `#2631480f`; link = deepseek-500
  - alias (dark, `body[data-ds-dark-theme]`): bg-base/layer = neutral-bluish-950 `#151517`; brand-primary = white; label-primary = neutral-bluish-50; borders use white low-alpha
  - radius scale (from DSH component CSS): 18px pill-buttons, 14px, 12px cards, 10px, 8px; code font stack `"SF Mono","JetBrains Mono","Fira Code",Consolas,"PingFang SC","Microsoft YaHei"`

## File Structure

| File | Responsibility |
|---|---|
| `web/src/app/global.css` | Single source of truth for all design tokens. Rewritten `+:root` and `.dark` blocks to DSH values; add `--font-sans`/`--font-mono` tokens; radius scale. |
| `web/src/components/ui/button.tsx` | Replace hardcoded `bg-[#2288ee]` default variant with token-driven `bg-primary`/hover; keep other variants. |
| `web/src/components/ui/card.tsx` | Radius/spacing/border to DSH card look (rounded-12, thin border-l2, 16px gap, platform bg). |
| `web/src/components/ui/table.tsx` | Row height, header bg (muted), border to DSH thin-line look; cell padding. |
| `web/src/components/ui/input.tsx` + `textarea.tsx` + `select.tsx` | Border l2, focus ring deepseek-500, height 36/28px. |
| `web/src/components/ui/badge.tsx` | DSH chip/pill look (rounded-full, label-tertiary text). |
| `web/src/index.html` | Add font preloads for mono/sans if we want custom webfonts; otherwise rely on system stack. |
| `web/src/app/login/` + `register/` + `reset-password/` page shells | Centered card on bg-base, DSH wordmark spacing. |
| Per-page `.module.css` files (11) | Only where they hardcode old shadcn colors; reconcile to tokens. Touch only on visual conflict. |

## Tasks

### Task 1: Rewrite global.css design tokens to DSH palette (light + dark)

**Files:**
- Modify: `web/src/app/global.css`

**Interfaces:**
- Consumes: DSH reference values above
- Produces: complete `+:root` and `.dark` token sets; new `--font-sans`, `--font-mono`; radius scale

- [ ] **Step 1: Rewrite `+:root` (light) block**
  - Set the 18 shadcn vars (`--background` … `--sidebar-ring`) to DSH light values:
    - `--background: #f9fafb; --foreground: #0f1115; --card: #ffffff; --card-foreground: #0f1115; --popover: #ffffff; --popover-foreground: #0f1115;
    - `--primary: #0f1115; --primary-foreground: #ffffff;
    - `--secondary: #f5f6f7; --secondary-foreground: #0f1115;
    - `--muted: #f5f6f7; --muted-foreground: #61666b;
    - `--accent: #f1f3f5; --accent-foreground: #0f1115;
    - `--destructive: #ec1313;
    - `--border: #0f11151f; --input: #0f11151f; --ring: #4176e6;
    - charts: `--chart-1: #4176e6; --chart-2: #22c55e; --chart-3: #f59e0b; --chart-4: #679efe; --chart-5: #ef4444;
    - sidebar: `--sidebar: #f5f6f7; --sidebar-foreground: #0f1115; --sidebar-primary: #0f1115; --sidebar-primary-foreground: #ffffff; --sidebar-accent: #f1f3f5; --sidebar-accent-foreground: #0f1115; --sidebar-border: #0f11151f; --sidebar-ring: #4176e6;
  - Set `--radius: 0.75rem` (12px base; the existing radius-sm/md/lg/xl calcs in `@theme inline` already derive 8/10/12/16 — bump base so xl→18: keep as-is, it's close enough).
  - Add `--font-sans` and `--font-mono` to the `@theme inline` block mapping to DSH stacks:
    - `--font-sans: "Inter","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;
    - `--font-mono: "SF Mono","JetBrains Mono","Fira Code",Consolas,"Liberation Mono",Menlo,"PingFang SC","Microsoft YaHei",monospace;
  - Add `--color-ring: var(--ring)` already present; ensure `@theme inline` exposes `--font-sans`/mono via `--font-sans`/... (Tailwind v4 auto-maps `--font-sans` to the `font-sans` utility when defined under `@theme`).

- [ ] **Step 2: Rewrite `.dark` block**
  - `--background: #151517; --foreground: #f9fafb; --card: #1b1b1c; --card-foreground: #f9fafb; --popover: #1b1b1c; --popover-foreground: #f9fafb;
  - `--primary: #f9fafb; --primary-foreground: #0f1115;
  - `--secondary: #212123; --secondary-foreground: #f9fafb;
  - `--muted: #212123; --muted-foreground: #81858c;
  - `--accent: #232324; --accent-foreground: #f9fafb;
  - `--destructive: #f25a5a;
  - `--border: #ffffff1f; --input: #ffffff1f; --ring: #4176e6;
  - charts same as light (legible on dark): keep `#4176e6 / #22c55e / #f59e0b / #679efe / #ef4444`
  - sidebar: `--sidebar: #0f1115; --sidebar-foreground: #f9fafb; --sidebar-primary: #f9fafb; --sidebar-primary-foreground: #0f1115; --sidebar-accent: #232324; --sidebar-accent-foreground: #f9fafb; --sidebar-border: #ffffff1f; --sidebar-ring: #4176e6;

- [ ] **Step 3: Set body font-family from the new token**
  - In `@layer base`, add `body { font-family: var(--font-sans); }` and a global `code, pre, kbd, samp { font-family: var(--font-mono); }` so code surfaces pick up the DSH mono stack.

- [ ] **Step 4: Build and visually verify both themes render**
  - Run `cd web && pnpm build` → exit 0.
  - Start `uv run main.py` (backend on 5300) and `cd web && pnpm dev` (frontend on 3000). Open http://127.0.0.1:3000, toggle theme via ThemeToggle; confirm light + dark both apply, no white-on-white / black-on-black.
  - **This step is the RED/GREEN visual gate:** before changes the primary button is blue `#2288ee`; after, it is near-black (light) / white (dark).

- [ ] **Step 5: Commit**
  - git add web/src/app/global.css; git commit -m "style(web): transcribe DSH design tokens into global.css light+dark"

### Task 2: Re-tokenize the base UI components

**Files:**
- Modify: `web/src/components/ui/button.tsx`, `card.tsx`, `table.tsx`, `input.tsx`, `textarea.tsx`, `badge.tsx`

**Interfaces:**
- Consumes: Task 1 tokens
- Produces: base components that follow `bg-primary`/borders/radius from tokens instead of hardcoded shadcn defaults

- [ ] **Step 1: button.tsx default variant → token-driven**
  - Replace `default: 'bg-[#2288ee] text-primary-foreground shadow-xs hover:bg-[#2277e0]'` with `default: 'bg-primary text-primary-foreground shadow-xs hover:opacity-90'`.
  - Keep destructive/outline/secondary/ghost/link variants, but change `outline` border to `border-border` (already token) and radius stays `rounded-md` (= token-derived 10px).

- [ ] **Step 2: card.tsx → DSH card**
  - Card root: `rounded-xl` → `rounded-[12px]` (token radius-lg), keep `border` (now token thin), `bg-card`. Reduce inner `gap-6` to `gap-4` for the tighter DSH look. Header/content padding `px-6` → `px-5`.

- [ ] **Step 3: table.tsx → DSH table**
  - `TableRow`: `hover:bg-muted/50` keep; ensure `border-b` uses token border.
  - `TableHeader`: add `bg-muted/30` to thead so header row reads as DSH's muted band.
  - `TableHead`: `text-sm` → keep, `font-medium` → `font-normal text-muted-foreground` for DSH's quieter header.

- [ ] **Step 4: input/textarea/badge → DSH**
  - `input.tsx`: border token (`border-input` already), `h-9` keep, focus ring already uses `ring-ring` (now deepseek).
  - `badge.tsx`: ensure default uses `rounded-full` + `text-muted-foreground bg-muted` (DSH pill/chip). If not, set it.

- [ ] **Step 5: Build + visual check**
  - `cd web && pnpm build` exit 0. Re-open the app; confirm buttons are now near-black/white, cards tighter, tables have muted header band, badges are pills.

- [ ] **Step 6: Commit**
  - git add web/src/components/ui/; git commit -m "style(web): re-tokenize base UI components to DSH visual"

### Task 3: Reconcile page-level CSS modules + login/register shells

**Files:**
- Modify (only where they fight the new tokens): the 11 `.module.css` under `web/src/app/home/` + `web/src/app/infra/`; login/register/reset-password shells.

**Interfaces:**
- Consumes: Tasks 1-2 tokens + base components
- Produces: no page hardcodes the old blue `#2288ee` or old shadcn grays; login/register read as DSH center-card

- [ ] **Step 1: Grep for old hardcoded colors**
  - `grep -rn "#2288ee\|#2277e0\|oklch" web/src/app web/src/components web/src/styles` → list every hit. These are the reconciliation targets.

- [ ] **Step 2: Replace old hardcoded grays/blues with token classes**
  - For each hit, swap the literal hex/oklch for the matching Tailwind token utility (`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`) or the CSS var (`var(--background)` etc. in `.module.css`).
  - Do NOT change layout/DOM — colors only.

- [ ] **Step 3: login/register/reset-password shells**
  - Ensure the auth screens are a centered card on `bg-background` with the DSH wordmark (letter-spacing .08em, 16px/600) and inputs/buttons from Task 2. If they already use base components, this is mostly a background/centering pass.

- [ ] **Step 4: Build + visual pass across main pages**
  - `cd web && pnpm build` exit 0. Walk Home (bots, pipelines, agents, knowledge, mcp, skills, monitoring), Workspaces, Settings, Login, Register in both light and dark; note any page still off.

- [ ] **Step 5: Commit**
  - git add web/src; git commit -m "style(web): reconcile page CSS modules + auth shells to DSH visual"

### Task 4: Full-visual acceptance sweep (both themes)

**Files:**
- Read-only verification; fix stragglers found.

**Interfaces:**
- Consumes: Tasks 1-3
- Produces: a documented checklist of pages × themes all matching DSH, with the two remaining known gaps closed

- [ ] **Step 1: Checklist sweep**
  - For each top-level route and both themes, confirm: background, card surfaces, borders (thin low-alpha), primary buttons (near-black/white), muted text (neutral-bluish-700/600), accent/ring (deepseek-500), code font (mono stack). Record any page that fails.

- [ ] **Step 2: Fix stragglers**
  - For each failing page, apply the minimal token/class fix (color only, no DOM change). Re-build.

- [ ] **Step 3: Lint + typecheck gate**
  - `cd web && pnpm lint && pnpm build` → exit 0.

- [ ] **Step 4: Run frontend unit tests**
  - `cd web && pnpm test:unit` → all green (these don't assert colors, but guard against accidental breakage).

- [ ] **Step 5: Commit**
  - git add web/src; git commit -m "style(web): full DSH visual acceptance sweep (light+dark)"

---

## Out of scope / explicitly NOT done
- No backend (`src/`, `tests/`, `pyproject.toml`) changes.
- No new npm dependencies, no DSH package import.
- No route/component-logic/DOM-structure changes — className + CSS tokens only.
- The `__main__.py` banner-trailing-whitespace edit already in the working tree is unrelated and stays as-is (not part of this plan).

## Verification evidence (verification-before-completion)
- `pnpm build` exit 0 after each task.
- `pnpm lint` + `pnpm test:unit` green at Task 4.
- Manual light+dark walkthrough recorded per Task 4 step 1.
- No `git status` changes outside `web/`.
