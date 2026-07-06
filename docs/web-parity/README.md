# Squabble Web → Peer of Native

> **⚠️ Superseded (2026-07-06).** Narrative planning now lives in
> `squabble-react-native/docs/vision/web-parity-spec.md` (product spec) and
> `web-parity-implementation.md` (technical plan, task tables, model routing).
> The **beads tree here remains live** and was refreshed the same day (new tasks,
> per-task implementation notes, `model-*` routing labels). `05-beads-epics.md`
> was rewritten to mirror the refreshed tree; other docs in this folder are
> historical reference with corrections noted inline.

**Master planning folder.** This documents the project to bring the Squabble web
app to feature-parity with the React Native app, add **Audiobookshelf (ABS)
streaming** to the web, and unify both apps on a single shared codebase.

> Status: **planning** (docs + beads task tree). No app code has changed yet.
> Execution sequencing is intentionally deferred until these docs are reviewed.

## The unlock

The native app's ABS integration already exposes streaming URLs
(`audioTracks[].contentUrl` from the `/api/items/:id/play` session). A browser can
play those directly — so web can become a true peer that **streams books**, not
just a progress/notes companion. And the native app's business logic
(`@squabble/shared`) is almost entirely platform-agnostic already, so most parity
work is *reuse*, not *rewrite*.

## Locked decisions

1. **Code sharing — web joins the monorepo.** `squabble-web` becomes `apps/web`
   inside the `squabble-react-native` Turborepo and imports `@squabble/shared`
   directly. Single source of truth; zero drift. → [`01-monorepo-migration.md`](./01-monorepo-migration.md)
2. **Streaming — hybrid transport.** Direct browser `<audio>` streaming with a
   Next.js proxy route as the CORS/auth fallback. → [`02-abs-streaming-spec.md`](./02-abs-streaming-spec.md)
3. **Design — use the claude_design MCP tooling** to drive theming + UI parity
   (visual previews of the 3 themes). → [`03-theming-tokenization.md`](./03-theming-tokenization.md)
4. **Scope of this round — docs + beads only.** No code; no committed execution order.

## Why this is cheaper than it looks

- **1 of 91** files in `packages/shared/src` imports `react-native`
  (`useRestoreLastPlayed.ts`). Every **service** and **store** is web-safe.
- `@squabble/shared` peer-deps are `firebase ^11` (web JS SDK), `react`, `zustand`
  — **no react-native / expo dependency**. Its `firebase` export is the web SDK.
- The 3-theme token system (`tokens.ts`) is pure data; `ThemeProvider`/`useTheme`
  are pure React. Both run in the browser unchanged.
- The only genuinely net-new web code is the **streaming audio player** and the
  ABS client port (mobile's `absService.ts`, which lives outside shared).

## Documents

| Doc | What it covers |
|-----|----------------|
| [`00-current-state.md`](./00-current-state.md) | Snapshot of web today and the native monorepo / shared package. |
| [`01-monorepo-migration.md`](./01-monorepo-migration.md) | Moving web into the Turborepo as `apps/web`; consuming `@squabble/shared`. |
| [`02-abs-streaming-spec.md`](./02-abs-streaming-spec.md) | ABS web streaming: hybrid transport, proxy route, player, sync. |
| [`03-theming-tokenization.md`](./03-theming-tokenization.md) | Porting the 3 themes; user theme preference; claude_design workflow. |
| [`04-feature-gap-analysis.md`](./04-feature-gap-analysis.md) | Native↔web gap table with per-gap plans and beads mapping. |
| [`05-beads-epics.md`](./05-beads-epics.md) | Human-readable mirror of the beads epic/task tree + critical path. |

## How to work this project

The work is tracked in **beads** (`bd`). See `05-beads-epics.md` for the tree, or:

```bash
bd list                 # all epics/tasks
bd ready                # unblocked work (starts with the E0 migration tasks)
bd show <id>            # details, acceptance criteria, dependencies
```
