# Circus Video Archive

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com)

A community-driven video archive platform for FSU Flying High Circus alumni to preserve and celebrate performance history.

**🎪 Live Site:** [flyinghighcircusarchives.com](https://flyinghighcircusarchives.com)

## The Problem

Following a tornado that damaged the circus tent and caused a multi-year disruption, significant institutional knowledge and performance history was lost. Alumni had videos scattered across personal drives with no centralized way to share or discover them.

## The Solution

This platform provides a searchable video archive where alumni can:
- **Upload & catalog** performances with metadata (act type, year, performers)
- **Tag performers** to create discoverable connections between videos
- **Vote on favorites** with weighted voting for tagged performers
- **Browse by category** across 24 circus act types

## Features

### V1 - Core Archive ✅
- YouTube video embedding and display
- Video submission with metadata
- 24 FSU circus act categories
- Browse and search interface

### V2 - Authentication & Performer Tagging ✅
- Name-based login (first name + last name)
- Video ownership tracking
- Performer tagging on videos
- Edit/delete videos (owner only)
- Filter videos by performer
- Auto-generated titles (Act + Year)

### V3 - Voting System ✅
- One "Best" vote per user per act category
- Vote switching (change vote within same act)
- Performer bonus (2x vote weight for tagged performers)
- Rankings homepage showing top-voted videos by act
- Voters list modal (see who voted)

### V4 - Comments & Community Pages ✅
- 140-character comments on videos (tweet-length)
- Character counter with visual feedback
- Edit/delete own comments
- Act leaderboards (videos ranked by votes)
- About page (FSU Flying High Circus history)
- Support page (developer info with Venmo)

### V5 - Multi-Act & UI Overhaul ✅
- Videos can belong to multiple act categories
- Show type classification (Home Show vs Callaway Show)
- Per-act voting (vote for same video in different categories)
- FSU Garnet & Gold color scheme
- Mobile-responsive design with hamburger menu
- Chip-based multi-select for acts

### V6 - Video Upload System ✅
- Direct video upload from browser (mobile & desktop)
- Client-side upload to Vercel Blob (up to 2GB files)
- Upload queue with admin visibility
- Local script processes queue and uploads to YouTube
- iOS Safari compatible

### V7+ - Future
- Facebook/Google OAuth
- Email invites and alumni verification

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth.js v5 (JWT) |
| Styling | Tailwind CSS v4 |
| Testing | Playwright (E2E) |
| Hosting | Vercel + Railway |
| Storage | Vercel Blob |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_PUBLIC_URL` | Yes | PostgreSQL connection string (use Railway's public URL) |
| `AUTH_SECRET` | Yes | NextAuth.js secret (generate with `openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | Production | Set to `true` for production |
| `NEXT_PUBLIC_APP_URL` | Optional | Public URL of the app |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob storage token |

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes (videos, acts, users, auth, comments)
│   ├── about/        # About page
│   ├── login/        # Login page
│   ├── submit/       # Video submission (protected)
│   ├── support/      # Support/donate page
│   └── videos/       # Browse and video detail pages
├── components/       # React components
│   ├── ui/           # Reusable primitives
│   ├── video/        # Video components
│   ├── comments/     # Comment form and display
│   ├── layout/       # Header, Footer, Navigation
│   └── search/       # Search and filter
├── lib/              # Utilities (db, auth, youtube)
└── types/            # TypeScript types

prisma/               # Database schema and migrations
docs/                 # Documentation
tests/                # Playwright E2E tests
```

## Development

```bash
# Type check
npx tsc --noEmit

# Run E2E tests
npx playwright test

# Open Prisma Studio
npx prisma studio

# Process upload queue (uploads queued videos to YouTube)
npm run queue:process
```

## Technical Highlights

- **Client-side uploads to Vercel Blob** bypass the 4.5MB serverless function limit, enabling 2GB video uploads directly from mobile browsers
- **Weighted voting system** gives performers a 2x vote bonus for videos they're tagged in, incentivizing accurate performer attribution
- **Hybrid upload pipeline** queues videos in Vercel Blob, then processes them via local script for YouTube upload (working around YouTube API quota limits)
- **Mobile-first responsive design** with hamburger navigation, tested at 375px width
- **Name-based auth** (no passwords) tailored for a trusted alumni community

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Technical decisions and trade-offs
- [API](docs/API.md) - Endpoint documentation
- [Deployment](docs/DEPLOYMENT.md) - Hosting and CI/CD

## License

Private - FSU Circus Community Use Only
