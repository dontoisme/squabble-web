# Help Center — Plan & Tracking

Public, wiki-like product documentation for the entire Squabble app, served at `/help` on squabble-web.

- **Epic:** `squabble-web-b4d` (label `help-center`)
- **Branch:** `feat/help-center`
- **Approach:** MDX files in `content/help/`, rendered with `next-mdx-remote/rsc` + `gray-matter`; typography via `@tailwindcss/typography` (`.prose-tavern`); no `next.config.ts` changes so content stays portable for the planned monorepo move (`docs/web-parity/01-monorepo-migration.md`).
- **Decisions (2026-07-05):** search deferred to backlog (`b4d.14`); v1 includes real screenshots curated from `squabble-react-native/e2e/screenshots/builds/build-79/screenshots/`; docs describe mobile as the primary product with `PlatformBadge` notes ("also on web" / "coming soon to web").
- **Content source of truth:** `squabble-react-native/docs/SCREEN-MAP.md` (authoritative), plus `VERBS-SURFACES-MAP.md`, `solo-quests-ux.md`, `async-quest-board-ux.md`, model files (`achievement.ts`, `title.ts`, `user.ts`), `PUNCHLIST.md` (known gaps for troubleshooting).
- **Authoring contract:** `docs/help-content-style-guide.md`

## Task map

| Bead | Task | Blocked by | Executor | Status |
|---|---|---|---|---|
| b4d.1 | Infra: MDX pipeline, `/help` routes, layout, MDX components, seed pages | — | main agent | ✅ closed |
| b4d.2 | Style guide + `_section.json` skeletons | — | opus agent | ✅ closed |
| b4d.3 | Content: Getting Started (4 pages) | .1, .2 | sonnet agent | ✅ closed |
| b4d.4 | Content: Library (5 pages) | .1, .2 | sonnet agent | ✅ closed |
| b4d.5 | Content: Audiobookshelf (4 pages) | .1, .2 | sonnet agent | ✅ closed |
| b4d.6 | Content: Player (6 pages) | .1, .2 | sonnet agent | ✅ closed |
| b4d.7 | Content: Guilds & Quests (8 pages) | .1, .2 | opus agent | ✅ closed |
| b4d.8 | Content: Achievements & Progress (4 pages) | .1, .2 | sonnet agent | ✅ closed |
| b4d.9 | Content: Settings & Account (4 pages) | .1, .2 | haiku agent | ✅ closed |
| b4d.10 | Content: Troubleshooting & FAQ (5 pages) | .1, .2 | sonnet agent | ✅ closed |
| b4d.11 | Nav links + sitemap + robots | .1 | haiku agent | ✅ closed |
| b4d.12 | Landing polish + cross-link pass | .3–.10 | sonnet agent | in progress |
| b4d.13 | QA + verification + closeout | .3–.11 | sonnet + main | open |
| b4d.14 | Client-side search (Cmd+K) | — | backlog (deferred) | open (backlog) |

**Notes from execution (2026-07-05):**
- Actual total is **40 pages**, not 34 (the per-section breakdown always summed to 40).
- Speed/skip ranges corrected against source: speeds are 0.5x–3.0x presets, skip intervals 5–90s (`SpeedSheet.tsx`, `SkipIntervalSheet.tsx`).
- Sitemap base URL: `NEXT_PUBLIC_SITE_URL ?? 'https://squabble.app'` — no canonical domain found in repo config, but invite links in the mobile app use `squabble.app`, so the fallback matches. Set the env var in Vercel to be explicit.
- Web auth today is email/password only (no OAuth, no password reset) — `creating-your-account.mdx` states this as present fact.
- Screenshots: 25 PNGs copied from `build-79`; ABS, Progress, and Troubleshooting sections ship without screenshots (none exist in the capture set).

## Page tree (8 sections, 40 pages)

- [x] **getting-started/** — what-is-squabble, creating-your-account, onboarding-tour, quick-start
- [x] **library/** — importing-books, views-filters-and-folders, book-details, managing-books, downloads-and-missing-books
- [x] **audiobookshelf/** — what-is-audiobookshelf, connecting-your-server, browsing-and-downloading, listening-on-the-web *(coming soon badge)*
- [x] **player/** — player-basics, speed-and-skip, sleep-timer, bookmarks, timestamp-comments, background-carplay-lockscreen
- [x] **guilds/** — guilds-overview, create-or-join, quest-board, epic-quests, solo-quests, rereads-new-read-plus, tavern-chat-and-topics, activity-feed-and-reactions
- [x] **progress/** — achievements, titles, streaks-and-stats, completing-a-book
- [x] **settings/** — profile, playback-settings, notifications, account-and-guild-management
- [x] **troubleshooting/** — faq, playback-issues, sync-and-progress, abs-connection-issues, contact-support

URLs: `/help/<section>/<page>`. Screenshots live in `public/help/<section>/`.

## Verification checklist (b4d.13)

- [ ] `npm run build` — all `/help/**` statically generated, zero type errors, sitemap builds without Firebase env
- [ ] `/help` loads logged-out (no `/login` redirect)
- [ ] Sidebar order matches `_section.json` / frontmatter `order`
- [ ] Breadcrumbs + prev/next correct across section boundaries
- [ ] Mobile sidebar collapses (<768px)
- [ ] Callout / Steps / Screenshot / PlatformBadge render
- [ ] `curl /sitemap.xml` lists help URLs; article metadata from frontmatter
- [ ] Accuracy spot-check 3 pages vs `SCREEN-MAP.md`
