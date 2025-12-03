# Technical Architecture

## Overview

The Circus Video Archive is a Next.js application that serves as a community-driven platform for preserving FSU Flying High Circus performance videos via YouTube embeds.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js v5 (JWT strategy) |
| Video | YouTube embeds (no self-hosted video) |
| Testing | Playwright (E2E) |
| Hosting | Vercel (app) + Railway (database) |

## Architecture Decisions

### YouTube-First Video Hosting

**Decision:** Use YouTube embeds exclusively instead of self-hosted video.

**Rationale:**
- Zero storage costs
- YouTube handles transcoding, CDN, and playback
- Familiar interface for users
- Videos may already exist on YouTube

### App Router (Next.js 16)

**Decision:** Use the App Router with Server Components.

**Rationale:**
- Server Components by default (better performance)
- Simplified data fetching
- Built-in layouts and loading states
- Future-proof architecture

### JWT Authentication

**Decision:** Use NextAuth.js with JWT session strategy (no database sessions).

**Rationale:**
- Simpler deployment (no session table management)
- Stateless authentication
- Name-based login fits community use case
- Easy to extend to OAuth later

### Prisma ORM

**Decision:** Use Prisma for database access.

**Rationale:**
- Type-safe database queries
- Auto-generated TypeScript types
- Easy migrations
- Great developer experience

## Data Model

```
User (1) ----< (N) Video (submitter)
User (N) ----< (N) Video (performers via VideoPerformer)
Act  (1) ----< (N) Video
```

### Entities

| Entity | Purpose |
|--------|---------|
| User | Alumni accounts (name-based login) |
| Video | YouTube video references with metadata |
| Act | Performance categories (24 FSU acts) |
| VideoPerformer | Join table for video-performer relationships |
| Account | OAuth account links (for future Facebook auth) |
| Session | Session tokens (unused with JWT strategy) |

### Schema Overview

```prisma
model User {
  id            String    @id @default(uuid())
  firstName     String
  lastName      String
  email         String?   @unique
  videos        Video[]   @relation("SubmittedVideos")
  performances  VideoPerformer[]
}

model Video {
  id            String    @id @default(uuid())
  youtubeUrl    String
  youtubeId     String
  title         String
  year          Int
  description   String?
  act           Act       @relation(...)
  submittedBy   User?     @relation("SubmittedVideos")
  performers    VideoPerformer[]
}

model Act {
  id            String    @id @default(uuid())
  name          String    @unique
  description   String?
  videos        Video[]
}

model VideoPerformer {
  video         Video     @relation(...)
  user          User      @relation(...)
  @@id([videoId, userId])
}
```

## API Design

RESTful API routes under `/api/`:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/videos` | GET | No | List videos with filtering |
| `/api/videos` | POST | Yes | Submit new video |
| `/api/videos/[id]` | GET | No | Get single video |
| `/api/videos/[id]` | PATCH | Owner | Update video |
| `/api/videos/[id]` | DELETE | Owner | Delete video |
| `/api/acts` | GET | No | List act categories |
| `/api/users` | GET | No | Search users |
| `/api/users` | POST | No | Create user (for tagging) |
| `/api/auth/*` | * | - | NextAuth.js routes |

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth.js
│   │   ├── videos/         # Video CRUD
│   │   ├── acts/           # Act listing
│   │   └── users/          # User search/create
│   ├── login/              # Login page
│   ├── submit/             # Video submission (protected)
│   └── videos/             # Browse and detail pages
│       └── [id]/
│           └── edit/       # Edit page (owner only)
├── components/
│   ├── ui/                 # Reusable primitives
│   ├── video/              # VideoCard, VideoPlayer, PerformerSelector
│   ├── layout/             # Header, Footer, Navigation
│   └── search/             # SearchBar, FilterPanel
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── auth.ts             # NextAuth.js configuration
│   ├── youtube.ts          # YouTube URL utilities
│   └── utils.ts            # General utilities
└── types/
    ├── index.ts            # Shared types
    └── next-auth.d.ts      # NextAuth type extensions
```

## Security

- **Authentication:** Name-based login with JWT sessions
- **Authorization:** Video edit/delete restricted to owner
- **Input validation:** YouTube URL validation, required fields
- **CSRF:** Handled by NextAuth.js
- **Environment:** Secrets stored in Vercel env vars

## Future Considerations

- **V3 Voting:** Add Vote model with user-video constraint
- **V4 Comments:** Add Comment model with threading
- **V5 OAuth:** Enable Facebook provider in auth.ts
- **V6 User Merging:** Handle duplicate user records
