# Help Content Style Guide

The authoring contract for Squabble Help Center pages. Every `.mdx` page under `content/help/` follows these rules. Read this before writing a single page — the page template, sidebar, and landing cards all depend on the frontmatter and component conventions below.

Squabble Inn is a social audiobook platform: a mobile-first React Native app with a companion Next.js web app, wrapped in a cozy tavern / fantasy LitRPG theme. Guilds of up to six readers take on Quests, leave spoiler-gated Timestamp Comments, and watch each other's Ghost Markers crawl along the timeline. Help pages explain how all of that actually works.

---

## Voice & Tone

Squabble's brand voice is **friendly but not childish, fantasy-themed but accessible** (see `docs/STYLE_GUIDE.md`). Help docs inherit that voice with one hard constraint: **clarity always wins.**

The rule of thumb: **fantasy theming seasons the prose; it never obscures the instructions.**

- **Section intros and headings** can carry the tavern flavor. "Gather your guild" is a fine intro line. "Every Quest keeps its own campfire of discussion" is fine.
- **Steps and troubleshooting are plain, direct, second person.** Tell the reader exactly what to tap. "Tap **Import**, then choose **From Files**." Never "Venture forth to the Import portal."
- Address the reader as **you**. Use present tense and active voice.
- Feature names are already themed (Quest Board, Tavern, Ghost Markers) — lean on those instead of inventing new metaphors mid-instruction.
- When in doubt, write the instruction plainly first, then decide whether one flavorful clause improves it. If the flavor adds a word count without adding clarity or warmth, cut it.

**Good:**

> Your **Quest Board** is where the guild's reading lives. To add a book, tap **+ Add Quest** and search for a title.

**Too much:**

> Brave adventurer, journey to thy sacred Quest Board and there inscribe a new tome upon the ancient ledger by invoking the Add Quest sigil.

---

## Frontmatter Contract

Every `.mdx` page **must** begin with this YAML frontmatter block. All three fields are required.

```yaml
---
title: "Importing Books"          # required — shown in sidebar + rendered as the page <h1>
description: "Add audiobooks from your device to your Squabble library."  # required — SEO meta + landing card subtitle
order: 1                          # required — position within the section (1-based)
---
```

Field rules:

- **`title`** — Title Case. Concise (2–5 words). This is what appears in the sidebar and as the page heading. Do **not** repeat it as an H1 in the body — the page template renders the `<h1>` for you.
- **`description`** — One sentence, plain and descriptive (this is SEO copy and appears on landing cards, so keep the fantasy flavor light here). Ends with a period. ~10–20 words.
- **`order`** — Integer. Determines the page's position within its section, matching the section's intended reading flow. First page is `1`.

### Body structure

1. **Start with a 1–2 sentence intro paragraph.** No heading — just a short lead that says what the page covers. This is the only prose that should precede the first heading.
2. **Use `##` for section headings. Never `#`.** (The `<h1>` is the page title, already rendered.) Use `###` for sub-sections when needed.
3. Do not restate the `title` anywhere in the body.

Example opening:

```mdx
---
title: "Importing Books"
description: "Add audiobooks from your device to your Squabble library."
order: 1
---

You can add audiobooks to Squabble straight from your device — no account or server required. This page covers importing local files and what formats are supported.

## Supported Formats
...
```

---

## MDX Components

These components exist and are the only custom components available. Use them as documented — don't invent new ones or pass undocumented props.

### `<Callout>`

```mdx
<Callout variant="info" title="Optional Title">
  Short, focused aside. One idea per callout.
</Callout>
```

Pick the variant by intent:

| Variant | Use for |
|---|---|
| `info` | Neutral notes, clarifications, "good to know" details. |
| `tip` | Power-user advice, shortcuts, optional optimizations. |
| `warning` | Destructive or irreversible actions (deleting, removing from guild, leaving a guild), and known issues/limitations. |
| `spoiler` | **Anything about Squabble's spoiler-protection mechanics** — how Timestamp Comments unlock, why a topic is hidden, Furthest Position gating. This variant is on-brand; use it whenever you explain the spoiler system. |

Rules: `title` is optional. Keep callouts to 1–3 sentences. Don't stack multiple callouts back-to-back — if you have that much to say, it belongs in body prose or a `<Steps>` block. Don't put a whole procedure inside a callout.

### `<Steps>` / `<Step>`

Use for **any procedure with 2 or more sequential actions.**

```mdx
<Steps>
  <Step title="Open the Quest Board">
    From your guild, tap the **Quests** tab.
  </Step>
  <Step title="Add a book">
    Tap **+ Add Quest** and search for the title.
  </Step>
</Steps>
```

Rules:

- **Step titles are imperative** — "Open the Quest Board", "Enter your invite code", "Tap Save". Not "Opening the board" or "The next step".
- One discrete action per step. Put the details (what you'll see, edge cases) in the step body.
- For a single action, just write a plain sentence — don't wrap one `<Step>` in `<Steps>`.

### `<Screenshot>`

```mdx
<Screenshot src="/help/library/import-sheet.png" alt="The import sheet showing From Files and Audiobookshelf options" caption="Choose where your audiobook comes from." />
```

Rules:

- **`alt` is required** and must meaningfully describe the image for screen readers.
- `src` follows `/help/<section>/<file>.png`.
- `caption` is optional.
- **If no suitable screenshot exists, omit the component entirely.** Never ship an empty or placeholder `src`. A page with no screenshot is fine.

### `<PlatformBadge>`

Inline badges marking where a feature works. Squabble docs describe the **mobile app as the primary product**, so mobile is the default assumption — you don't need a `mobile` badge on every feature.

```mdx
Your library is available on your phone <PlatformBadge platform="mobile" /> and in your browser <PlatformBadge platform="web" />.
```

| Platform | Use when |
|---|---|
| `mobile` | Emphasizing a mobile-only feature, or clarifying a feature is mobile-first. |
| `web` | The feature **also** works in the web app. Add this to: library viewing, the guild feed, notes/topics, and invites. |
| `coming-soon` | Planned but not shipped web features — e.g. in-browser Audiobookshelf streaming. Only use for genuinely planned work. |

Place badges inline, right after the feature name or the sentence that introduces it.

### `<Kbd>`

For **literal keys or buttons only** — e.g. `<Kbd>Space</Kbd>` to play/pause on web, or a literal on-screen button label when you specifically mean the key. Do **not** use `<Kbd>` for feature names or general emphasis; use **bold** for UI element names.

---

## Terminology Glossary

Use these canonical spellings and capitalizations **exactly**. These are proper nouns in Squabble — capitalize them as shown, even mid-sentence.

| Term | Definition / usage |
|---|---|
| **Guild** | A private reading group of up to **6 members**, joined by a **6-character invite code**. Not "group" or "club". |
| **Adventurer** | A member of a guild. Use for guildmates ("the other Adventurers in your guild"). |
| **Quest** | A book the guild reads together. |
| **Quest Board** | The guild's shared book list on the Quests tab: one combined board of active quests (books being read sorted above queued ones) plus a collapsible **Completed Quests** list. Do NOT describe "Reading Now"/"Up Next" as named UI sections — that layout was removed from the app (SCREEN-MAP.md line 134 is stale). |
| **Epic Quest** | A whole book series tracked as a single quest. |
| **Solo Quest** | Sharing your Timestamp Comments on a personal book with guildmates who also own that book. |
| **New Read+** | Reread mode. Each reread earns a tiered loot color: Common → Uncommon → Rare → Epic → Legendary → Mythic → Artifact → Transcendent → Ultimate → Ascended. Written "New Read+" (no space before the plus). |
| **Tavern** | Free-form guild chat, with **no spoiler gating**. The guild's hangout channel. |
| **Topics** | Timestamp-anchored discussion threads (also surfaced as "Tavern Talk" on a quest). Spoiler-gated by position. |
| **Ghost Markers** | Guildmates' live progress markers on the player timeline. Each Adventurer has their own color. |
| **Timestamp Comments** | Spoiler-gated comments pinned to a moment in the audiobook. They **unlock for a guildmate only once that guildmate reaches that point**. |
| **Titles** | Equippable earned honorifics (e.g. Second Scroll, The Archivist). You equip one at a time. |
| **Audiobookshelf** / **ABS** | The self-hosted audiobook server integration. Spell out **Audiobookshelf** on first mention per page, then **ABS** is acceptable. |
| **MiniPlayer** | The compact persistent player. One word, capital P. |
| **Sleep Timer** | The timer that stops playback after a set duration (off, or 5–60 min). |
| **Furthest Position** | The furthest point you've reached in a book — the anchor for spoiler gating. Capitalized. |

Other conventions:

- **Squabble** or **Squabble Inn** — the product. Never "the Squabble app" as a proper noun (lowercase "app" is fine descriptively).
- Write **guildmate(s)** (one word) for "other members of your guild" in running prose; use **Adventurer** when you want the themed noun.
- Don't pluralize themed nouns awkwardly — "your Quests", "the guild's Adventurers".

---

## Cross-Linking

Link the **first mention** of another documented feature on each page. Use relative-style absolute paths:

```mdx
Add books to your guild's [Quest Board](/help/guilds/quest-board) to read together.
```

- Link only the **first** mention of a given feature per page; plain text thereafter.
- Every page is self-contained — assume the reader landed here from search and hasn't read the section's other pages. Cross-links help, but the page must stand on its own without them.
- Link to the canonical page for a concept (e.g. spoiler mechanics → the Timestamp Comments page), not to a passing mention elsewhere.

Path map (sections): `getting-started`, `library`, `audiobookshelf`, `player`, `guilds`, `progress`, `settings`, `troubleshooting`.

---

## Writing Rules

- **Length: 300–800 words per page.** If a topic runs longer, it probably wants to be split into two pages.
- **Every page is self-contained.** Don't rely on "as mentioned on the previous page."
- **UI element names in bold** — buttons, tabs, sheet names, toggles: **Import**, **Quests** tab, **Sleep Timer**. (Feature/proper nouns keep their capitalization; bold them on first reference where they're an actionable UI element.)
- **No future promises** except explicitly `coming-soon`-badged items. Don't write "we're planning to..." or "soon you'll be able to..." in prose. If it isn't shipped and isn't a badged coming-soon feature, don't mention it.
- **American English** spelling and punctuation throughout.
- Use sentence case for `##` headings ("Adding a book"), Title Case for the frontmatter `title`.
- Prefer short paragraphs (2–4 sentences) and bulleted lists over dense blocks.
- Numbers: spell out one through nine in prose, use numerals for anything with a unit or UI value ("6-character code", "5 min", "up to 6 members").
