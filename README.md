# Netflix & Decide

**Tinder for Netflix shows.** Swipe on shows with your partner, then discover what you both love.

**[Live Demo](https://netflix-swipe.vercel.app)**

## How It Works

1. **Create a room** — one person starts a session and gets a 6-character code
2. **Share the code** — your partner joins using the code
3. **Swipe independently** — drag cards right to like, left to pass (or use the buttons)
4. **See your matches** — when you both like the same show, it's a match

## Features

- **Drag-to-swipe cards** with smooth framer-motion animations, LIKE/NOPE stamps, and spring physics
- **Button controls** for like and pass with animated card exits
- **Real-time match detection** — matches are detected instantly when both partners like the same show
- **Match celebration overlay** with spring animation, auto-dismisses after 4 seconds
- **Room-based multiplayer** via 6-character codes, partner status polling every 10 seconds
- **Progress tracking** — see how far along you and your partner are
- **~50 curated Netflix shows** with real poster images from TMDB
- **Mobile-first dark UI** designed for couch use
- **Geist font** for clean, modern typography

## Tech Stack

| Technology | Purpose |
|---|---|
| [TanStack Start](https://tanstack.com/start) | Full-stack React framework with SSR |
| [TanStack Router](https://tanstack.com/router) | Type-safe file-based routing |
| [TanStack Query](https://tanstack.com/query) | Server state management and polling |
| [Framer Motion](https://motion.dev) | Drag gestures and card animations |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Geist Font](https://vercel.com/font) | Sans and mono typefaces |
| [Zod](https://zod.dev) | Input validation for server functions |
| [TypeScript](https://typescriptlang.org) | Full type safety |

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx                  # Root layout (dark mode, Geist font)
│   ├── index.tsx                   # Homepage — create or join a room
│   └── swipe/
│       ├── $roomId.tsx             # Swiping interface
│       └── $roomId.matches.tsx     # Matches grid
├── components/swipe/
│   ├── SwipeCard.tsx               # Draggable card with framer-motion
│   ├── CardStack.tsx               # Manages visible card stack (3 deep)
│   ├── SwipeActions.tsx            # Like / Nope buttons
│   ├── MatchCelebration.tsx        # "It's a Match!" overlay
│   ├── MatchCard.tsx               # Card for the matches grid
│   ├── RoomCodeDisplay.tsx         # Room code with copy-to-clipboard
│   └── WaitingForPartner.tsx       # Waiting screen with animations
├── server/function/
│   └── swipe.ts                    # Server functions (create/join room, swipe, matches)
├── lib/
│   ├── shows/
│   │   ├── data.ts                 # ~50 Netflix shows with TMDB poster URLs
│   │   └── types.ts                # Show, Room, UserSwipes types
│   └── swipe/
│       └── queries.ts              # Query options and mutation hooks
└── styles/
    └── app.css                     # Tailwind v4 config with Geist font
```

## Architecture

- **Room state** is stored in an in-memory `Map<string, Room>` on the server — no database needed
- **Identity** uses a random UUID stored in `sessionStorage` (no auth required)
- **Show order** is shuffled per room so both partners see the same sequence
- **Match detection** happens atomically on the server when a swipe is submitted
- **Partner polling** uses `refetchInterval: 10_000` on the room state query

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — create a room in one tab, join with the code in another.

## Deployment

Deployed on [Vercel](https://vercel.com). Push to `main` or run:

```bash
vercel deploy --prod
```

## License

MIT
