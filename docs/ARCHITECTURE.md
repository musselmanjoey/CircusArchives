# Technical Architecture

## Overview

The Circus Video Archive is a Next.js application that serves as a community-driven platform for preserving circus performance videos via YouTube embeds.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Video | YouTube embeds (no self-hosted video) |

## Architecture Decisions

### YouTube-First Video Hosting

**Decision:** Use YouTube embeds exclusively instead of self-hosted video.

**Rationale:**
- Zero storage costs
- YouTube handles transcoding, CDN, and playback
- Familiar interface for users
- Videos may already exist on YouTube

### App Router (Next.js 14+)

**Decision:** Use the new App Router instead of Pages Router.

**Rationale:**
- Server Components by default (better performance)
- Simplified data fetching
- Built-in layouts and loading states
- Future-proof architecture

### Prisma ORM

**Decision:** Use Prisma for database access.

**Rationale:**
- Type-safe database queries
- Auto-generated TypeScript types
- Easy migrations
- Great developer experience

## Data Model

```
Act (1) ----< (N) Video
```

### Core Entities (V1)

- **Act**: Performance categories (Juggling, Aerial, etc.)
- **Video**: YouTube video references with metadata

### Future Entities (V2+)

- **User**: Alumni accounts with verification
- **Vote**: Community voting on performances
- **Comment**: Discussion threads
- **Tag**: Searchable tags
- **Performer**: People identification

## API Design

RESTful API routes under `/api/`:

- `GET /api/videos` - List videos with filtering
- `POST /api/videos` - Submit new video
- `GET /api/acts` - List act categories

## Folder Structure

```
src/
├── app/           # Next.js App Router
│   ├── api/       # API routes
│   ├── videos/    # Video pages
│   └── submit/    # Submission page
├── components/    # React components
│   ├── ui/        # Reusable primitives
│   ├── video/     # Video-specific
│   ├── layout/    # Header, Footer, Nav
│   └── search/    # Search/filter
├── lib/           # Utilities
└── types/         # TypeScript types
```
