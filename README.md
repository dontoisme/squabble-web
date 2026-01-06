# Squabble Web

A minimal web app for leaving hidden timestamped notes on audiobooks with friends.

## Features

- **Hidden Notes**: Leave notes at specific timestamps that are only revealed when friends reach that point
- **Guild System**: Create or join a reading group with a 6-character invite code
- **Progress Tracking**: Track your progress with chapter-based entry
- **Mage Tank Series**: Hardcoded support for Mage Tank 1-3 (70, 67, 83 chapters)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Fill in your Firebase config (values are pre-filled for squabble-app-fbc28)

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this folder to a GitHub repo (or use the Squabble monorepo)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repo
4. Set the root directory to `squabble-web` if using monorepo
5. Add environment variables from `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
6. Deploy!

## How It Works

### Hidden Notes
Notes are stored at `guilds/{guildId}/comments/{commentId}` with:
- `timestamp`: position in seconds
- `text`: note content (max 280 chars)

When fetching notes, they're only shown if `note.timestamp <= userProgress.progressTimestamp`.

### Progress Tracking
Progress is stored at `guilds/{guildId}/progress/{bookId}_{userId}` with:
- `progressTimestamp`: current position in seconds
- `progressPercent`: calculated percentage

### Guild System
- Create guild: generates 6-char invite code
- Join guild: enter invite code to join
- Share progress and notes with guild members

## Firebase Setup

Uses the existing Squabble Firebase project (`squabble-app-fbc28`). The web app:
- Shares the same Firestore database as the iOS app
- Uses the same security rules
- Notes left on web appear on iOS and vice versa

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Firebase Auth + Firestore
- TypeScript
