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

### V4+ - Future
- Comments and discussion
- Facebook OAuth
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

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes (videos, acts, users, auth)
│   ├── login/        # Login page
│   ├── submit/       # Video submission (protected)
│   └── videos/       # Browse and video detail pages
├── components/       # React components
│   ├── ui/           # Reusable primitives
│   ├── video/        # Video components
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
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Technical decisions
- [API](docs/API.md) - Endpoint documentation
- [Deployment](docs/DEPLOYMENT.md) - Hosting and CI/CD
- [Business Proposal](docs/business/PROPOSAL.md) - Project proposal

## License

Private - FSU Circus Community Use Only
