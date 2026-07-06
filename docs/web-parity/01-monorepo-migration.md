# 01 — Monorepo Migration (E0)

> **Superseded (2026-07-06)** by `squabble-react-native/docs/vision/web-parity-implementation.md` §E0.
> Key correction below is marked ⚠️; the refresh also added tasks the original
> missed: Vercel project migration, shared-firebase web bundling fixes
> (AsyncStorage `require` + `__DEV__` in `packages/shared/src/firebase/config.ts`),
> npm→pnpm lockfile migration, and a rules/index/auth-domain audit.

**Goal:** move `squabble-web` into the `squabble-react-native` Turborepo as
`apps/web`, so it imports `@squabble/shared` directly. This is the foundation —
it unblocks reusing the shared services/stores/hooks that make parity cheap.

## Target shape

```
squabble-react-native/                 (the monorepo, pnpm@10 + turbo 2.3)
  apps/
    mobile/      @squabble/mobile       (unchanged)
    web/         @squabble/web          (← squabble-web moves here)
  packages/
    shared/      @squabble/shared       (consumed by both)
  functions/                            (unchanged)
```

`pnpm-workspace.yaml` already globs `apps/*` and `packages/*`, so `apps/web` is
picked up automatically once moved. `turbo.json` already defines `build`/`dev`/
`lint`/`clean` with `.next/**` in build outputs — Next is already anticipated.

## Why it's low-risk

- `@squabble/shared` has **no react-native/expo dependency** (peerDeps: `firebase`,
  `react`, `zustand`). Web already uses `firebase` (v12) + React 19 — ~~compatible
  with the `^11` peer range~~ ⚠️ **Correction (2026-07-06): firebase ^12 does NOT
  satisfy the `^11` peer range.** Decision: web downgrades to firebase ^11 for v1;
  a coordinated workspace-wide 12 bump is a future bead. See implementation doc §2.
- Shared is consumed **as TypeScript source** (`main: ./src/index.ts`), so web's
  Next/SWC transpiles it. Add `@squabble/web` `transpilePackages: ['@squabble/
  shared']` in `next.config.ts` so Next compiles the shared source.
- Only `useRestoreLastPlayed.ts` in shared imports RN — and web simply won't import
  that hook. No change to shared required for the migration itself.

## Migration tasks

1. **Land web as `apps/web`.** Move the `squabble-web` tree under
   `squabble-react-native/apps/web`. Rename its package to `@squabble/web`. Keep
   Next 16 / React 19. Decide repo mechanics (subtree/move + history) at execution
   time — out of scope for this doc.
2. **Wire workspace + Next.** Add `@squabble/shared: "workspace:*"` to web deps;
   set `transpilePackages: ['@squabble/shared']` in `next.config.ts`; confirm
   `pnpm install` links it and `turbo run dev --filter @squabble/web` boots.
3. **Reconcile dependency versions.** `firebase` (web 12 vs shared peer ^11 — pick
   one), `react` 19.1 vs 19.2, `zustand` (web doesn't use it yet — add). Single
   lockfile; resolve duplicates so there's one `firebase` instance.
4. **Adopt shared firebase.** Replace `lib/firebase/config.ts` usage with shared's
   `app, auth, db` (`from '@squabble/shared'`). Keep web-only **admin** SDK and the
   Hardcover/waitlist API routes as web-local server code. Confirm env vars
   (`NEXT_PUBLIC_FIREBASE_*`) feed the shared client config in a web context.
5. **Adopt shared models.** Replace `lib/firebase/types.ts` with `@squabble/shared`
   models (`User`, `Guild`, `GuildBook`, `Comment`, `Topic`, …). Reconcile any
   web-local field drift (e.g. web's `Note`/`Progress` shapes vs shared `Comment`/
   `userProgress`). This is the highest-touch step — do it incrementally per
   feature rather than big-bang.
6. **Verify build/lint/typecheck** across the workspace; web app runs against the
   shared package with no regressions to existing web screens.

## What stays web-only

- Next.js App Router, pages, layouts, shadcn/ui components.
- Server routes: `app/api/hardcover/*`, `app/api/waitlist`, and the new
  `app/api/abs/stream` proxy (see `02-`).
- `firebase-admin` server usage.
- Web token storage (IndexedDB) — the web analog of `expo-secure-store`.

## Open items to confirm at execution time

- Exact `firebase` major to standardize on (shared peer `^11` vs web `12`).
- Whether shared should be **prebuilt** (`tsc` to `dist`) or stay source +
  `transpilePackages`. Source is simpler; prebuild is faster for CI.
- ESLint/TS config sharing between `apps/web` and the root configs.
- Repo history strategy for the move (not blocking the plan).
