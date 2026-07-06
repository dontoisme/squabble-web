# 03 — Theming / Tokenization (E2)

> **Superseded (2026-07-06)** by `squabble-react-native/docs/vision/web-parity-implementation.md` §4.
> Additions in the refresh: `spacing.ts` shadow tokens are RN-shaped and need
> per-theme `box-shadow` translation (bead 3z8.7); the hardcoded member-color hex
> arrays in `BookCover.tsx`/`ProgressBarWithGhosts.tsx` move to accent-token vars
> (bead 3z8.6); native still has no theme persistence, so web leads with
> localStorage + `users/{uid}.preferences.theme`.

**Goal:** the web app renders in the **same 3 themes** as native
(`hearthfire`, `sanctuaryMoon`, `dragonfire`) and lets the user pick one — instead
of today's single hardcoded "tavern" dark theme.

## Source of truth

`packages/shared/src/theme/tokens.ts` — three `Theme` objects, each ~28 colors +
typography (sizes, weights, leading) + identity string. Plus `spacing.ts`
(`spacing`/`radius`/`shadow`). All pure data; `ThemeProvider`/`useTheme`/
`useSetTheme` are pure React and run in the browser unchanged.

Token color groups (per theme): `brand*`, `bg*` (base/raised/raisedAlt/panel/
inset/overlay), `border*` (subtle/faint/hair), `text*` (primary/secondary/muted/
dim/onBrand), semantics (`success/warn/error/info` + `*Alt`), member accents
(`accentPurple/Pink/Teal/Cyan`).

## Strategy: tokens → CSS variables, switched by theme

The web app uses shadcn semantic CSS vars (`--background`, `--primary`, `--card`,
`--border`, …) wired through Tailwind v4 `@theme inline` in `app/globals.css`.
Today those are a frozen single palette (≈ Hearthfire). Plan:

1. **Emit each theme as a CSS-variable block** keyed by a `data-theme` attribute:
   `[data-theme="hearthfire"] { … }`, `[data-theme="sanctuaryMoon"] { … }`,
   `[data-theme="dragonfire"] { … }`. Generate these from `tokens.ts` (a small
   build step or generated file) so the values never drift from native.
2. **Map shadcn semantic vars onto Squabble tokens** (one mapping, all themes):
   - `--background → bgBase`, `--card/--popover → bgRaised`, `--secondary/--muted →
     bgPanel`/`bgInset`, `--primary → brand`, `--primary-foreground → textOnBrand`,
     `--accent → brandDeep`/`brandSubtle`, `--border/--input → borderSubtle`,
     `--ring → brand`, `--destructive → error`, `--muted-foreground → textMuted`,
     `--foreground → textPrimary`, charts → member `accent*`.
3. **Expose Squabble-native tokens too** (`--bg-raised-alt`, `--text-dim`,
   `--accent-teal`, `--brand-subtle`, etc.) for components that need them beyond
   shadcn's vocabulary, plus the spacing/radius scales.
4. **Drop the hardcoded `.dark` lock.** Remove the forced `className="dark"` in
   `app/layout.tsx`; the active theme is set via `data-theme` on `<html>`.

## User theme preference

- Wire `next-themes` (already a dependency, currently unused) to switch
  `data-theme` across the 3 themes (not just light/dark). Persist to `localStorage`
  for instant load + avoid flash (inline script in `<head>`).
- Optionally also persist to Firestore (`users/{uid}` or `libraryConfig`) so the
  choice follows the user across devices. **Web can lead here** — native currently
  resets to `sanctuaryMoon` each launch and does not persist. If we add a Firestore
  field, native can later read it for true cross-platform theme sync.
- Default theme: match native's `sanctuaryMoon` for consistency (confirm at
  execution).

## Typography & scale

- Map the type scale (`textXs…text3xl`, weights, leading) to Tailwind/CSS so web
  text sizing tracks native. Native leaves `fontBody`/`fontHeading` undefined
  (system font); web keeps Geist or aligns fonts later — cosmetic, low priority.
- Spacing/radius from `spacing.ts` → CSS vars / Tailwind theme extension so layout
  rhythm matches.

## claude_design MCP workflow (locked decision)

Use the `claude_design` tooling to make the tokenization **visual and reviewable**,
not just a hex translation:

1. `create_project` for "Squabble Web Theming"; load the design prompt
   (`get_claude_design_prompt`) for guidance.
2. Feed the three token sets in; `write_files` a tokenized component sheet
   (buttons, cards, inputs, badges, progress bars, player controls) and
   `render_preview` each across all 3 themes to eyeball parity vs the native
   ThemePreview screen.
3. Use it again for **net-new web screens** (player, activity feed, tavern) so they
   are designed in-theme from the start rather than retro-fitted.

Treat its output as a **design reference + generated token/preview artifacts**, not
a replacement for the code mapping in steps 1–4 above.

## Acceptance

All existing web screens render correctly in each of the 3 themes; a visible theme
switcher changes the whole app; the choice persists across reloads; the rendered
palette matches the native ThemePreview screen for the same theme.
