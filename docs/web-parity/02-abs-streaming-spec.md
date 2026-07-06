# 02 — ABS Web Streaming Spec (E1)

> **Kept as reference; design revised (2026-07-06).** The current streaming design
> is `squabble-react-native/docs/vision/web-parity-implementation.md` §3.
> **Corrections to this doc:**
> 1. **Mixed content, not just CORS:** an https web app cannot load `http://`
>    audio at all. http-only LAN/Tailscale servers are also unreachable by a
>    Vercel-hosted proxy (private network) — they are **unsupported on hosted
>    web**; the connect UI must guide users to TLS (`tailscale serve`, reverse
>    proxy).
> 2. **Proxy token custody:** the "proxy looks up the ABS token server-side"
>    idea is impossible — tokens live only client-side (IndexedDB). Revised:
>    `app/api/abs/session` mints an HttpOnly, path-scoped cookie carrying the
>    encrypted `{serverUrl, token}`; the stream route reads it.
> 3. **Multi-track is mandatory, not an edge case:** many ABS books are
>    multi-file MP3 sets; the engine must queue all `audioTracks[]` with a
>    global-position ↔ (track, offset) map (bead rq4.7).
> 4. Hosted proxy cannot reach LAN/tailnet servers — no proxy workaround for
>    http servers exists.

**Goal:** stream a book from the user's ABS server in the browser — **no
downloads**. This is the novel capability that makes web a true peer.

## Why streaming works in a browser

When the native app starts playback it POSTs `/api/items/:id/play` and gets back an
`ABSPlaybackSession` whose `audioTracks[]` each carry a `contentUrl`, `mimeType`,
`startOffset`, and `duration`. Those `contentUrl`s are HTTP endpoints that support
**range requests** (seeking) and **token auth**. Native ignores them (it downloads
instead) — web will be the first consumer.

A browser `<audio>` element streams an MP3/M4B URL natively, using Range headers
for seek/buffer. The only frictions are **auth** (an `<audio src>` can't send an
`Authorization: Bearer` header) and **CORS** (a self-hosted ABS server may not send
permissive headers). Both are solved by the hybrid transport below.

## Hybrid transport (locked decision)

Two paths; the client picks per-connection and remembers what worked.

### Path A — Direct streaming (preferred when it works)
- `<audio src="${contentUrl}?token=${absToken}">` (token in query param, since the
  element can't set headers).
- Requires the user's ABS server to return `Access-Control-Allow-Origin` (and allow
  Range) for the web origin. Many self-hosted setups won't.
- Lowest latency, no server hop, no bandwidth through our infra.

### Path B — Proxy fallback (`/api/abs/stream`)
- A Next.js route handler that takes `{connectionId, contentUrl, range}`, looks up
  the ABS token **server-side**, fetches the ABS URL with the `Authorization`
  header + forwarded `Range`, and streams the response back same-origin.
- Sidesteps CORS entirely and keeps the token off the client URL.
- Must faithfully **pass through Range / Content-Range / Accept-Ranges / 206** so
  `<audio>` seeking works. Stream the body (don't buffer whole files in memory).
- Costs a server hop + egress; acceptable as a fallback.

### Selection logic
1. On connect, probe: attempt a tiny ranged direct fetch of a known item. If CORS
   blocks it, mark the connection **proxy-required** and persist that.
2. Player builds its `src` from the chosen path. Auto-fall-back: a direct-mode
   media error flips the connection to proxy and reloads.

## ABS client port (into `@squabble/shared`)

Move `apps/mobile/src/services/absService.ts` → shared (e.g.
`packages/shared/src/services/absClient.ts`), abstracting its only RN deps:

- `Platform` (react-native) + `expo-application` are used to build `deviceInfo`
  for `/api/items/:id/play`. Replace with an injected `DeviceInfoProvider`
  interface; web supplies `{ clientName: 'Squabble Inn Web', clientVersion,
  deviceName: navigator.userAgent-derived, osName, osVersion }`.
- Everything else (login, authorize, libraries, items, search, play session,
  session sync/close, progress get/patch) is platform-agnostic fetch + Bearer token
  and moves unchanged. Mobile keeps importing the same module.

Reuse already-shared pieces as-is: `models/abs.ts` (types), `absStore.ts`
(`useABSStore`), `services/absIntegrationConfig.ts` (Firestore metadata at
`users/{uid}/integrations/abs`).

## Web token storage (replaces expo-secure-store)

- Store the ABS token in **IndexedDB**, keyed by `connectionId`, same interface as
  mobile's `absConnectionService` (`saveConnection`, `getActiveConnection`, …).
- IndexedDB is origin-scoped and HTTPS-only in practice — acceptable. The token is
  never placed in a logged URL (Path B keeps it server-side; Path A's query-param
  token only ever hits the user's own ABS server).
- Non-sensitive metadata (serverUrl, username, connectionId) continues to live in
  Firestore via `absIntegrationConfig` so reconnect survives a cleared browser.
- Scope v1 to a **single active connection**; multi-server support is a later add.

## Web player

- HTML5 `<audio>` (single element) fed the multi-track session. Handle ABS books
  that are split into multiple `audioTracks` by mapping global position →
  `(trackIndex, offset)` using each track's `startOffset`/`duration`, and swapping
  `src` at track boundaries. (Single-file M4B is the simple common case.)
- **MediaSession API** for OS/lock-screen metadata + transport controls
  (play/pause/seek/skip), mirroring the native player.
- Controls to reach parity: play/pause, ±skip, chapter nav, variable speed, sleep
  timer, scrubber with chapter + guild **ghost** markers, sticky MiniPlayer.
  (Player-UI items are tracked under E4 in `04-`/`05-`; E1 covers the streaming
  engine + a minimal transport to prove playback.)

## Progress + session sync (reuse)

- **To ABS:** port `useABSSessionSync` — start a session on play, `POST
  /api/session/:id/sync` every ~5 min with `{currentTime, timeListened, duration}`,
  close on stop. Keep the exponential-backoff-on-failure behavior. Fallback to
  `PATCH /api/me/progress/:id` if session start 401/404s.
- **To Firestore:** reuse shared `userProgress.saveUserProgress` so guild **ghost
  markers** and cross-device resume work identically to mobile.

## End-to-end acceptance for the streaming slice

Connect a web session to an ABS server → browse a library → pick a book → it
**streams and plays** (direct or proxy) → seeking works → position syncs to ABS and
to Firestore so a guildmate sees the ghost move. No file is downloaded.
