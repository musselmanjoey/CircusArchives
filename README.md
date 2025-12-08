# Circus Video Archive

A community-driven platform for preserving and celebrating FSU Flying High Circus performance history.

**Live Site:** [flyinghighcircusarchives.com](https://flyinghighcircusarchives.com)

## Mission

Following the tornado that damaged the circus tent and caused a multi-year disruption, significant institutional knowledge was lost. This platform aims to recapture that knowledge and give it back to the performer community as a lasting gift.

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
| `DATABASE_URL` | Yes | PostgreSQL connection string |
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

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Technical decisions
- [API](docs/API.md) - Endpoint documentation
- [Deployment](docs/DEPLOYMENT.md) - Hosting and CI/CD
- [Business Proposal](docs/business/PROPOSAL.md) - Project proposal

## License

Private - FSU Circus Community Use Only
