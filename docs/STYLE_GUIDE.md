# Squabble Inn - Style Guide

## Brand Identity

Squabble Inn is a **tavern-themed audiobook companion app**. The visual language evokes a cozy fantasy inn where adventurers gather to share stories.

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Tavern Brown** | `#432618` | Header backgrounds, primary accent areas |
| **Copper/Gold** | `#D4A574` | Primary accent, active states, highlights |
| **Dark Background** | `#1a1a1a` | Main background |
| **Card Background** | `#2a2a2a` | Cards, elevated surfaces |
| **Border** | `#3a3a3a` | Subtle borders, dividers |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#4CAF50` | Completed, checkmarks |
| **Warning** | `#FFA000` | In progress, attention |
| **Error** | `#ff4444` | Errors, destructive actions |
| **Gold** | `#FFD700` | Achievements, special highlights |

### Ghost/Progress Colors

Member progress markers use this sequence:
```
#3B82F6  // Blue
#22C55E  // Green
#F97316  // Orange
#A855F7  // Purple
#EC4899  // Pink
```

### New Read+ (Re-read) Colors

Loot rarity progression for multiple reads:
```
#D4A574  // 1: Common (Copper)
#22C55E  // 2: Uncommon (Green)
#3B82F6  // 3: Rare (Blue)
#A855F7  // 4: Epic (Purple)
#F97316  // 5: Legendary (Orange)
#EC4899  // 6: Mythic (Pink)
#06B6D4  // 7: Artifact (Cyan)
#FFD700  // 8: Transcendent (Gold)
#EF4444  // 9: Ultimate (Red)
#E5E7EB  // 10+: Ascended (White)
```

## Typography

- **Primary Font**: System UI / Sans-serif
- **Monospace**: For codes, timestamps, chapter indicators
- **Hierarchy**:
  - Page titles: Bold, larger
  - Section headers: Semi-bold
  - Body text: Regular
  - Muted/secondary: Lighter color (`#888` or muted-foreground)

## Components

### Cards
- Background: `#2a2a2a`
- Border: `#3a3a3a` (subtle)
- Border radius: `0.625rem` (10px)
- Hover state: Slightly lighter background

### Buttons

**Primary Button**
- Background: `#D4A574` (copper)
- Text: Dark (`#1a1a1a`)
- Hover: Slightly darker copper

**Secondary/Outline Button**
- Background: Transparent or `#2a2a2a`
- Border: `#3a3a3a`
- Text: White or copper

**Ghost Button**
- Background: Transparent
- Text: Muted
- Hover: Subtle background

### Progress Bars
- Track: `#3a3a3a`
- Fill: `#D4A574` (or run color for New Read+)
- Height: 8px for main bars, 4px for compact

### Badges
- Guild badges use copper accent
- Status badges use semantic colors
- Subtle background with matching text

## Dark Mode

The app is **dark-mode only** to match the cozy tavern atmosphere. Light mode is not supported.

## Spacing

Use consistent spacing scale:
- `4px` - Tight spacing
- `8px` - Default small
- `12px` - Medium
- `16px` - Default
- `24px` - Large sections
- `32px` - Page margins

## Iconography

Use [Lucide React](https://lucide.dev/) icons for web, matching the Ionicons used in mobile where possible.

Common icons:
- Library: `Library`
- Guild: `Users`
- Progress: `Play`, `Pause`
- Chapters: `List`
- Settings: `Settings`
- Add: `Plus`
- Check: `Check`, `CheckCircle`

## Animation

- Subtle transitions (150-200ms)
- No flashy animations
- Loading states use gentle pulse or spin
- Page transitions: Fade

## Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

## Voice & Tone

- **Friendly but not childish**
- **Fantasy-themed but accessible**
- Guild terminology: "adventurers", "quests", "guild"
- Progress as "journey"
- Books as "adventures"

## Examples

### Empty State
```
No books in your guild's library yet.
Start an adventure by adding a book!
```

### Success Message
```
Quest added to the guild library!
```

### Error Message
```
Couldn't join the guild. Check your invite code.
```
