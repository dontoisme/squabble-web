# 05 — Beads Epic / Task Tree

Human-readable mirror of the beads tree, **refreshed 2026-07-06** to match the
approved plan in `squabble-react-native/docs/vision/web-parity-spec.md` +
`web-parity-implementation.md`. Query live state with `bd list -l web-parity --limit 200`
(note: `bd list` defaults to 50 rows; the tree is 62 issues).

Every task carries: a `model-{opus|sonnet|haiku}` label + `model=` metadata
(routing for agent execution), a size (S/M/L) and implementation notes appended
2026-07-06. Routing legend: **opus** = architecture / repo surgery / streaming
engine / spoiler-critical; **sonnet** = standard feature build over shared logic;
**haiku** = mechanical / config / generation / display-only.

## Epics

| Epic | ID | Priority | Depends on | Wave |
|------|----|----------|------------|------|
| **E0** — Web joins the monorepo (`apps/web` + `@squabble/shared`) | `squabble-web-b8t` | P1 | — (foundation) | 0 |
| **E1** — ABS web streaming (no downloads) | `squabble-web-rq4` | P1 | E0 | 1 (critical path) |
| **E2** — Theming / tokenization (3 themes + preference) | `squabble-web-3z8` | P2 | E0 | 1 |
| **E3** — Social feature parity (comments, topics, tavern, feed) | `squabble-web-6cu` | P2 | E0 | 1 |
| **E4** — Player-adjacent UX | `squabble-web-rpb` | P2 | E1 (rq4.4 + rq4.7) | 2 |
| **E5** — Profile, achievements *(trimmed: .4/.5 → backlog)* | `squabble-web-982` | P3 | E0 | 2 |
| **E6** — Epic Quests / series | `squabble-web-5a4` | P3 | E0 (5a4.3 also needs 6cu.3) | 2 |
| **E7** — Auth parity *(now explicitly in scope)* | `squabble-web-6du` | P3 | E0 | 1 |

## Tasks by epic

**E0 — Monorepo migration** (b8t.1–.5 strictly sequential; .7/.8/.9 parallel after .2)
- b8t.1 Land squabble-web as `apps/web` (git subtree, history preserved) — M · **opus**
- b8t.2 Workspace + `transpilePackages` wiring — S · sonnet
- b8t.3 Dependency reconciliation (**firebase: web downgrades ^12→^11**; add zustand) — M · **opus**
- b8t.4 Adopt shared firebase (app/auth/db); admin + Hardcover/waitlist stay web-local — M · sonnet
- b8t.5 Adopt shared models (types-compile-green only; hooks rewired in feature epics) — L · sonnet
- b8t.6 Workspace green; 7-surface web regression + mobile build proof — M · sonnet
- b8t.7 *(new)* Vercel deploy migration (Root Dir `apps/web`, pnpm, turbo-ignore) — M · sonnet
- b8t.8 *(new)* Shared-firebase web bundling fixes (AsyncStorage require, `__DEV__`) — S · sonnet
- b8t.9 *(new)* Rules / index / auth-domain audit for web query patterns — S · sonnet

**E1 — ABS streaming** (corrections vs old doc 02: mixed content blocks http; cookie token custody; multi-track mandatory)
- rq4.1 Port absService → shared `absClient.ts` (DeviceInfoProvider; mobile re-pointed) — M · **opus**
- rq4.2 IndexedDB ABS token store — S · sonnet
- rq4.3 ABS connection UI (`/settings/abs`, reachability diagnosis) — M · sonnet
- rq4.4 Direct streaming path (engine + `contentUrl?token=`, minimal transport UI) — L · **opus**
- rq4.5 Proxy fallback + HttpOnly-cookie session mint (Range/206 passthrough) — M · **opus**
- rq4.6 ABS session sync + Firestore progress (shared `sync.ts` unchanged; presence free) — M · sonnet
- rq4.7 *(new)* Multi-track playback engine (global-position map, gapless swap) — L · **opus**
- rq4.8 *(new)* Transport probe + auto-fallback (direct↔proxy) — S · sonnet
- rq4.9 *(new)* ABS library browse + Listen entry points — M · sonnet

**E2 — Theming**
- 3z8.1 Generate per-theme CSS-var blocks from `tokens.ts` (committed output) — S · haiku
- 3z8.2 Map shadcn semantic vars onto Squabble tokens (`@theme inline`) — M · sonnet
- 3z8.3 Remove `.dark` lock; 3-way next-themes switcher (`data-theme`) + persistence — M · sonnet
- 3z8.4 Design-tool component sheet + 3-theme previews (degrade to screenshots) — M · sonnet
- 3z8.5 Firestore theme preference (`users/{uid}.preferences.theme`) — S · sonnet
- 3z8.6 *(new)* Member-color token exception (BookCover, ProgressBarWithGhosts) — S · haiku
- 3z8.7 *(new)* Spacing/radius/shadow CSS translation — S · haiku

**E3 — Social parity** (feed = server fan-out `users/{uid}/feed`; never port `services/activity.ts`)
- 6cu.1 Replace web `useNotes` with shared comments (**spoiler-critical**) — L · **opus**
- 6cu.2 Reactions, threaded replies, milestones, reveal toast — M · sonnet
- 6cu.3 Topics on shared gating + replies (incl. series-scope read path) — M · sonnet
- 6cu.4 Tavern chat UI (guild-wide + per-book) — M · sonnet
- 6cu.5 Guild activity feed (feedStore subscription + renderers + tap nav) — M · sonnet
- 6cu.6 Solo quests + pinned quest + quest-board shelves — M · sonnet
- 6cu.7 *(new)* Adventurer presence display (`currentlyListening`) — S · sonnet
- 6cu.8 *(new)* Comment drafts (localStorage) — S · haiku
- 6cu.9 *(new)* Comment permalink migration (`/note/...` → comment permalink) — S · sonnet

**E4 — Player UX** (Wave 2; scrubber needs rq4.7's global-position domain)
- rpb.1 Chapter picker / navigation — S · sonnet
- rpb.2 Variable speed + sleep timer — S · sonnet
- rpb.3 Bookmarks UI — S · sonnet
- rpb.4 Scrubber with chapter + guild ghost markers — M · sonnet
- rpb.5 Sticky MiniPlayer + MediaSession (engine in top-level client provider) — M · sonnet
- rpb.6 *(new)* Keyboard shortcuts — S · haiku

**E5 — Profile / achievements** (scope trimmed 2026-07-06)
- 982.1 Profile UI (name, avatar color, equipped title) — M · sonnet
- 982.2 Listening stats UI — S · haiku
- 982.3 Titles / achievements display — S · sonnet
- ~~982.4 Notification preferences UI~~ → **backlog**
- ~~982.5 Web notification delivery decision~~ → **backlog**

**E6 — Epic Quests**
- 5a4.1 Series browse / adopt UI — M · sonnet
- 5a4.2 Per-member series progress — M · sonnet
- 5a4.3 Series-wide topics (ORDER: requires 6cu.3 first) — M · sonnet
- 5a4.4 Run-tier badges — S · haiku

**E7 — Auth parity** (in scope per 2026-07-06 decision)
- 6du.1 Google OAuth (popup + redirect fallback, account linking) — M · sonnet
- 6du.2 Password reset email flow — S · haiku
- 6du.3 Onboarding alignment (create/join guild → first book) — M · sonnet

## Execution waves & critical path

```
Wave 0  E0: b8t.1 → b8t.2 → b8t.3 → b8t.4 → b8t.5 → b8t.6
            (parallel after b8t.2: b8t.7, b8t.8, b8t.9)

Wave 1  (all parallel after b8t.6)
  A streaming*: rq4.1 → rq4.2 → rq4.3 → rq4.4 → { rq4.5, rq4.7 } → rq4.8 → rq4.6 ; rq4.9 after rq4.3
  B theming:    3z8.1 → 3z8.2 → 3z8.3 → { 3z8.6, 3z8.7, 3z8.4, 3z8.5 }
  C social:     6cu.1 → { 6cu.2, 6cu.9, 6cu.8 } ; 6cu.3 ; 6cu.4 ; 6cu.5 → 6cu.7 ; 6cu.6
  D auth:       { 6du.1, 6du.2 } → 6du.3

Wave 2
  E4 after rq4.4 + rq4.7 ;  E5 (982.1 → 982.3 ; 982.2) ;  E6 (5a4.3 after 6cu.3)

* critical path: E0 → rq4.4 → rq4.7 → E4
```

Sizes: **L×4** (b8t.5, rq4.4, rq4.7, 6cu.1) · M×~20 · S×~18.
Model split: **opus×7** (b8t.1, b8t.3, rq4.1, rq4.4, rq4.5, rq4.7, 6cu.1) · sonnet×~26 · haiku×9.

> When ready, claim the first E0 task: `bd update squabble-web-b8t.1 --claim`.
