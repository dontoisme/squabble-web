# 00 — Current State

> **Historical snapshot.** Kept as the 2026-06-22 baseline; superseded by the
> 2026-07-06 plan in `squabble-react-native/docs/vision/` (see README banner).

Snapshot from session exploration (2026-06-22). Paths are concrete; verify before
relying on any single line.

## Web app today (`squabble-web/`)

A **Next.js 16 App Router** app. Functions as a guild **companion**: library,
notes, topics, progress, guild management — but **no audio playback** and **no ABS
awareness**. The actual listening happens on mobile.

| Aspect | State |
|--------|-------|
| Framework | Next.js 16.1.1, React 19.2.3, TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york), `lucide-react`, `sonner` |
| Theme | **Hardcoded dark** "tavern" theme; `next-themes` installed but unused; `<html className="dark">` in `app/layout.tsx` |
| State | React Context (`contexts/AuthContext.tsx`) + Firestore `onSnapshot`; **no Zustand** |
| Firebase | Own client config `lib/firebase/config.ts` (project `squabble-app-fbc28`); own types `lib/firebase/types.ts`; admin SDK in `lib/firebase/admin.ts` |
| Auth | Firebase email/password only |
| External | Hardcover API proxy for metadata (`app/api/hardcover/*`) |
| Audio | **None** — no `<audio>`, Howler, MediaSession, or streaming |
| ABS | **None** — no references anywhere |

**Routes:** `/` (marketing), `/invite/[code]`, `/note/[guildId]/[noteId]`,
`/(auth)/login`, `/(auth)/signup`, `/(main)/library`, `/(main)/library/[bookId]`,
`/(main)/guild`. **API:** `/api/hardcover/{search,lookup,status}`, `/api/waitlist`.

**Business logic hooks** (web-local, Firestore-backed): `hooks/useGuild.ts`,
`useGuildBooks.ts`, `useProgress.ts`, `useNotes.ts`, `useTopics.ts`,
`useHardcover.ts`. These duplicate logic that already exists in `@squabble/shared`
— migration will replace most of them.

**Theme tokens today** (`app/globals.css`): shadcn semantic vars mapped to a
single palette — `--background:#1a1a1a`, `--primary:#D4A574` (copper),
`--accent:#432618` (tavern). This is effectively the **Hearthfire** theme frozen
as the only option.

## Native monorepo (`squabble-react-native/`)

A **Turborepo** (pnpm@10, turbo 2.3):

```
pnpm-workspace.yaml → apps/*, packages/*, tools/*
apps/mobile          @squabble/mobile   (Expo / React Native 0.81 / RN 19.1)
packages/shared      @squabble/shared   (the reuse goldmine)
functions            Cloud Functions (fan-out feed, milestones, reveals)
```

### `@squabble/shared` — what's already cross-platform

`package.json` peerDeps: **`firebase ^11`, `react`, `zustand` — no RN/expo**.
`main`/`types` point at `src/index.ts` (consumed as source, transpiled by the app).

```
src/
  firebase/        app, auth, db (WEB firebase JS SDK), connectToEmulators
  firestoreInstrumented.ts   wrapper around firestore calls (tracking)
  models/          all domain types (User, Guild, Comment, Topic, EpicQuest, abs, …)
  services/        comments, topics, tavern, epicQuests, activity, guild,
                   guildBooks, guildTitles, userProgress, userLibrary,
                   notificationPreferences, soloQuestService, auth,
                   absIntegrationConfig, sync, seen*, … (ALL web-safe)
  store/           Zustand: comments, topics, tavern, feed, guild, guildBooks,
                   player, library, epicQuests, abs, bookmarks, … (ALL web-safe)
  hooks/           useGuild, useGuildBooks, useTopics, useComments*, useTavernChat,
                   useFeed, useEpicQuests, useNotificationPreferences, … (web-safe
                   except useRestoreLastPlayed.ts — the ONLY RN import in shared)
  theme/           tokens.ts (3 themes), spacing.ts, ThemeContext.tsx (pure React)
```

**Coupling audit:** exactly **1 / 91** files in `packages/shared/src` imports
`react-native`/`expo` (`hooks/useRestoreLastPlayed.ts`). Everything else is
portable to web as-is.

### ABS integration (lives in `apps/mobile`, NOT shared)

- API client: `apps/mobile/src/services/absService.ts` — pure REST/fetch + Bearer
  token, **except** it imports `Platform` (react-native) and `expo-application`
  for device info. This is the main thing to abstract + move into shared.
- Connection lifecycle: `apps/mobile/src/services/absConnectionService.ts` — stores
  token in `expo-secure-store` (web needs IndexedDB instead).
- Firestore metadata (web-safe, already shared): `services/absIntegrationConfig.ts`
  (`users/{uid}/integrations/abs`, non-sensitive only — never stores tokens).
- Store (web-safe, already shared): `store/absStore.ts` (`useABSStore`).
- Session sync: `apps/mobile/src/hooks/useABSSessionSync.ts` — 5-min `/api/session/
  :id/sync`; logic portable, playback hooks differ.
- **Streaming today is unused**: native *downloads* full files
  (`absDownloadService.ts`, `expo-file-system`) and plays local files via
  `react-native-track-player`. The `audioTracks[].contentUrl` stream URLs in the
  play-session response are never used — web will be the first consumer.

### Theme tokens (`packages/shared/src/theme/tokens.ts`)

Three fully-specified themes — `hearthfire`, `sanctuaryMoon` (native default),
`dragonfire` — each with the same ~28-color + typography shape. Pure data.
`spacing.ts` adds `spacing`/`radius`/`shadow` scales. `ThemeProvider`/`useTheme`/
`useSetTheme` are pure React. **Native does not persist the theme choice** (resets
to `sanctuaryMoon` each launch) — web can lead by persisting it.

### Firestore data model (shared by both apps)

Same project, same collections. Key paths: `users/{uid}` (+ subcollections
`progress`, `library`, `titles`, `feed`, `integrations`, `devices`,
`libraryConfig`), `guilds/{gid}` (+ `members`, `books`, `comments`(+`replies`),
`topics`(+`replies`), `progress`, `activity`, `epicQuests`, `tavern`,
`soloQuests`), `epicQuests/{id}` (global), `inviteCodes/{code}`, `waitlist/{hash}`.
Spoiler-gating, reread-gating, and `canonicalId` cross-matching are enforced
client-side in shared services. See `squabble-react-native/docs/FIRESTORE-ERD.md`.
