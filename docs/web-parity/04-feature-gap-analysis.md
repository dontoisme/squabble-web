# 04 — Feature Gap Analysis

> **Superseded (2026-07-06)** by `squabble-react-native/docs/vision/web-parity-spec.md`.
> ⚠️ **Correction:** any row implying the activity feed or adventurer presence use
> shared `services/activity.ts` is wrong — that is the legacy client-side
> aggregator and must **not** be ported. The live feed is server fan-out: Cloud
> Functions write per-recipient, spoiler-gated docs to `users/{uid}/feed`, read
> via `feedStore`/`useFeed`. Presence reads `users/{uid}.currentlyListening` via
> `parseCurrentlyListening`.

Every native feature with its current web status and the beads epic that closes the
gap. **Reuse column** notes what already exists in `@squabble/shared` (the bulk of
non-player logic), so most rows are *wire up shared logic + build UI*, not *rewrite*.

Status legend: ✅ at parity · 🟡 partial / needs alignment · ❌ absent.

## Playback & ABS

| Feature | Web | Plan | Reuse | Epic |
|---|---|---|---|---|
| ABS server connection (login, validate, store token) | ❌ | Port `absService` to shared (abstract RN device-info); IndexedDB token store; connect UI | `absStore`, `absIntegrationConfig` (shared); `absService`/`absConnectionService` (port) | E1 |
| Stream a book (no download) | ❌ | Hybrid transport: direct `<audio>`+token, `/api/abs/stream` proxy fallback | `audioTracks[].contentUrl` from play-session | E1 |
| Audio player (play/pause, skip, scrubber) | ❌ | HTML5 `<audio>` + MediaSession; minimal transport in E1, full UI in E4 | `playerStore` | E1 / E4 |
| ABS session sync (5-min) + Firestore progress | ❌ | Port `useABSSessionSync`; reuse `saveUserProgress` | `useABSSessionSync` (port), `userProgress` (shared) | E1 |
| Chapter picker / nav | ❌ | Chapter list UI driven by track/chapter metadata | chapter data in session/item | E4 |
| Variable speed (0.5–2.0x) | ❌ | `audio.playbackRate` + control | `playerStore` | E4 |
| Sleep timer | ❌ | Timer that pauses playback | — | E4 |
| Bookmarks (furthest position) | ❌ | UI over bookmarks store | `bookmarksStore` (shared) | E4 |
| MiniPlayer (sticky) | ❌ | Persistent web mini-player | `playerStore` | E4 |
| Ghost markers (guildmate positions on scrubber) | 🟡 (web shows ghosts in progress bar, no scrubber) | Render on the player scrubber | `guilds/{gid}/progress` | E4 |

## Library & books

| Feature | Web | Plan | Reuse | Epic |
|---|---|---|---|---|
| Guild library (reading / queued / finished) | ✅ | Align to shared models during migration | `useGuildBooks`, `guildBooksStore` | E0 |
| Book detail | ✅ | Keep; swap web-local hooks for shared | `guildBooks` services | E0 |
| Personal library / import from ABS | ❌ | Browse ABS library → add as guild book | ABS client + `userLibrary` | E1 |
| Book metadata enrichment (Hardcover) | ✅ (web has Hardcover proxy) | Keep web routes; reconcile with native enrichment | `useEnrichmentSync` (shared) | E0 |

## Social (the differentiation)

| Feature | Web | Plan | Reuse | Epic |
|---|---|---|---|---|
| Timestamped comments | 🟡 (web "Notes", 280-char, no spoiler gate logic from shared) | Replace web `useNotes` with shared `useComments*`/`comments` service | `comments` service, `commentsStore`, comment hooks (shared) | E3 |
| **Spoiler gating** (visible past timestamp) | 🟡 | Adopt shared gating (consistent with native) | shared comment/topic visibility selectors | E3 |
| **Reread gating** (hide re-reader comments from first-timers) | ❌ | Adopt shared `rereadGated` handling | shared | E3 |
| Emoji reactions | ❌ | Reaction UI over `reactions` map | `comments` service | E3 |
| Comment replies (threaded) | ❌ | Replies UI | `comments`/`replies` (shared) | E3 |
| Milestone comments (start/complete/solo) | ❌ | Render milestone items (bypass gating) | shared | E3 |
| Comment-reveal toast/notification | ❌ | Web reveal indicator when crossing thresholds | reveal selectors (shared) | E3 |
| Topics (chapter-locked threads) + replies | 🟡 (web has basic topics) | Align to shared gating + replies | `useTopics`, `topicsStore`, `topics` service (shared) | E3 |
| Tavern chat (guild-wide + per-book) | ❌ | Build chat UI | `useTavernChat`, `tavernStore`, `tavern` service (shared) | E3 |
| Guild activity feed | ❌ | Feed UI | `useFeed`, `feedStore` (shared); Cloud Functions already fan-out | E3 |
| Adventurer activity (currently-listening / idle / tavern) | ❌ | Member status UI | `activity` service (shared) | E3 |
| Solo quests (personal read shared w/ guild) | ❌ | Solo-quest UI | `soloQuestService` (shared) | E3 |

## Guild

| Feature | Web | Plan | Reuse | Epic |
|---|---|---|---|---|
| Create / join guild, invite codes | ✅ | Align to shared | `useGuild`, `guildStore`, `guild` service | E0 |
| Members list + roles | ✅ | Keep | `guild` service | E0 |
| Pinned quest (featured book) | ❌ | Pin UI | `guildBooks`/`guild` service | E3 |
| Quest board (reading-now / up-next / completed) | 🟡 (web library ≈ this) | Align presentation to native | shared | E3 |

## Epic Quests / series

| Feature | Web | Plan | Reuse | Epic |
|---|---|---|---|---|
| Series definitions + guild adoption | ❌ | Series UI | `useEpicQuests`, `epicQuestsStore`, `epicQuests` service (shared) | E6 |
| Per-member series progress | ❌ | Progress UI | shared | E6 |
| Series-wide topics (progressive reveal) | ❌ | Series topic scope | shared `topics` (scope=series) | E6 |
| Run-tier badges (first/rare/legendary) | ❌ | Badge components | shared | E6 |

## Profile, achievements, notifications

| Feature | Web | Plan | Reuse | Epic |
|---|---|---|---|---|
| Profile (display name, avatar color, equipped title, class) | 🟡 (web derives name from email; no profile) | Build profile UI | shared User model + `userTitles` | E5 |
| Listening stats | ❌ | Stats UI | `listeningStats` on User | E5 |
| Titles / achievements display | ❌ | Title UI | `useUnlockedTitles`, `userTitles` (shared) | E5 |
| Notification preferences | ❌ | Prefs UI | `useNotificationPreferences`, `notificationPreferences` (shared) | E5 |
| Notification **delivery** on web (web-push) | ❌ | **Sub-decision** — web-push vs in-app only; flagged, not assumed | needs design | E5 |

## Auth & onboarding

| Feature | Web | Plan | Reuse | Epic |
|---|---|---|---|---|
| Email/password sign in | ✅ | Keep | shared `auth` / Firebase | E0 |
| Google OAuth | ❌ | Add Google sign-in (web popup/redirect) | Firebase Auth | E7 |
| Apple sign in | ❌ (iOS-only on native) | Out of scope for web v1 | — | — |
| Password reset | ❌ | Firebase reset email flow | Firebase Auth | E7 |
| Onboarding (create/join guild, add first book) | 🟡 (web has signup→guild) | Align flow to native | shared | E7 |

## Theming

| Feature | Web | Plan | Reuse | Epic |
|---|---|---|---|---|
| 3 themes (hearthfire/sanctuaryMoon/dragonfire) | ❌ (single hardcoded) | Tokens → CSS vars; switcher | `theme/tokens.ts` (shared) | E2 |
| Persisted user theme preference | ❌ | `next-themes` + localStorage (+ optional Firestore) | — (web leads) | E2 |

## Coverage note

Every native feature from the inventory is categorized above. Items explicitly
**out of scope for web v1**: Apple Sign-In (iOS-only), offline downloads (web
streams instead), persistent library-folder access (RN/OS-specific). Web-push
delivery is flagged as an open sub-decision under E5, not assumed.
