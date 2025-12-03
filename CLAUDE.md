# Circus Video Archive - Claude Code Project Guide

## Project Overview

A YouTube-based video archive platform for FSU Flying High Circus alumni to preserve, share, and celebrate historical performance videos. Following the tornado that damaged the circus tent and caused multi-year disruption, significant institutional knowledge was lost. This platform recaptures that knowledge as a gift to the performer community.

### Core Concept
- YouTube-first video hosting (embedded links only, no self-hosted video)
- Alumni-only access via email invite system (future)
- Videos organized by year and act type
- Community voting for best performances (future)
- Comments, tagging, and performer identification (future)

### Tech Stack
- **Frontend:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS v4
- **Testing:** Playwright for E2E
- **Video:** YouTube embeds only

---

## Version Roadmap

Features grouped to minimize context switching:

| Version | Focus | Features | Status |
|---------|-------|----------|--------|
| V1 | Core Archive MVP | YouTube embedding, video submission, browse/search, act categorization | ✅ Done |
| V2 | Authentication + Performer Tagging | Name-based login, protected routes, tag performers on videos | 🔄 In Progress |
| V3 | Voting System | One vote per user, rankings by act, yearly aggregation | Planned |
| V4 | Community Features | Comments, trick tagging | Planned |
| V5 | Advanced Auth | Facebook OAuth, email invites, alumni verification | Planned |
| V6 | User Management | Profile merging, name matching, duplicate handling | Planned |

**Important:** Check the current version status before implementing features.

---

## Project Structure

```
circus-video-archive/
├── CLAUDE.md                    # This file
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── api/                 # API routes
│   │   │   ├── videos/route.ts  # Video CRUD operations
│   │   │   └── acts/route.ts    # Act listing
│   │   ├── videos/              # Video browsing pages
│   │   │   ├── page.tsx         # Browse all videos
│   │   │   └── [id]/page.tsx    # Single video view
│   │   └── submit/page.tsx      # Video submission form
│   ├── components/
│   │   ├── ui/                  # Reusable UI (Button, Input, Card, Select)
│   │   ├── video/               # VideoCard, VideoPlayer, VideoGrid, VideoSubmitForm
│   │   ├── layout/              # Header, Footer, Navigation
│   │   └── search/              # SearchBar, FilterPanel, YearFilter
│   ├── lib/
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── youtube.ts           # YouTube URL parsing/validation
│   │   └── utils.ts             # General utilities (cn helper)
│   └── types/
│       └── index.ts             # TypeScript types
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
├── tests/
│   └── e2e/                     # Playwright tests
│       ├── video-browsing.spec.ts
│       ├── video-submission.spec.ts
│       └── video-player.spec.ts
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md
    ├── API.md
    └── business/                # Business proposal documents
        ├── PROPOSAL.md
        ├── VALUE_PROPOSITION.md
        ├── ROADMAP.md
        ├── COMPETITIVE_ANALYSIS.md
        └── GAP_ANALYSIS.md
```

---

## Multi-Agent Workflow Support

This project was originally set up with Antigravity IDE workflows in `.agent/`. For Claude Code multi-agent development, use the Task tool with these specialized agents:

### Agent Types for This Project

| Task Type | Subagent Type | Use For |
|-----------|---------------|---------|
| Feature Development | `general-purpose` | Building components, API routes, database work |
| Code Exploration | `Explore` | Finding files, understanding codebase structure |
| Planning | `Plan` | Designing implementation strategy for complex features |
| Documentation | `claude-code-guide` | Questions about Claude Code itself |

### Example Multi-Agent Patterns

**Parallel exploration:**
```
"Search for all video-related components" + "Find all API routes" + "Check test coverage"
```

**Sequential implementation:**
```
1. Plan the feature architecture
2. Implement database changes
3. Build API routes
4. Create UI components
5. Write tests
```

---

## Work Modes

When working on this project, I may ask you to focus on specific areas:

### CODING MODE
Use when: Building features, components, API routes, database work.

**Component Guidelines:**
- Use functional components with hooks
- Prefer named exports: `export const ComponentName = () => {}`
- Keep components under 150 lines - split if larger
- Place reusable UI in `src/components/ui/`
- Use TypeScript interfaces for all props

**API Route Pattern:**
```typescript
// Standard structure for src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.model.findMany();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

**YouTube URLs:**
Always use utilities in `src/lib/youtube.ts`:
```typescript
import { extractYouTubeId, isValidYouTubeUrl } from '@/lib/youtube';
```

**Quality Checklist:**
- [ ] TypeScript has no errors (`npx tsc --noEmit`)
- [ ] No `console.log` in production code
- [ ] Loading states for async operations
- [ ] Error states with user-friendly messages
- [ ] Mobile-responsive (test at 375px width)

---

### TESTING MODE
Use when: Writing tests, running test suites, debugging test failures.

**Playwright E2E Tests**
Location: `tests/e2e/`

**Test Structure:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/relevant-page');
  });

  test('should do expected behavior', async ({ page }) => {
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

**Commands:**
```bash
npx playwright test              # Run all tests
npx playwright test [file]       # Run specific file
npx playwright test --ui         # Interactive UI mode
npx playwright test --debug      # Debug mode
```

---

### DOCUMENTATION MODE
Use when: Writing docs, README files, API documentation.

**Output Locations:**
- Technical docs: `/docs/`
- Business docs: `/docs/business/`

---

### BUSINESS MODE
Use when: Competitive research, proposal writing, value proposition work.

**Key Talking Points:**
1. Knowledge Preservation Crisis - Tornado disruption caused institutional knowledge loss
2. Low Cost - YouTube hosts videos free, minimal infrastructure
3. Community Driven - Alumni contribute and curate content
4. Complements Existing Efforts - Works alongside Oral History Project
5. Unique Asset - One of only two collegiate circuses in the US

---

## Database Schema (V1 MVP)

```prisma
model Act {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  videos      Video[]

  @@map("acts")
}

model Video {
  id          String   @id @default(uuid())
  youtubeUrl  String   @map("youtube_url")
  youtubeId   String   @map("youtube_id")
  title       String
  year        Int
  description String?
  actId       String   @map("act_id")
  act         Act      @relation(fields: [actId], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("videos")
}
```

**Conventions:**
- UUID for all primary keys
- `created_at` and `updated_at` on all tables
- snake_case for database columns
- camelCase for TypeScript

---

## Common Commands

```bash
# Development
npm run dev                    # Start dev server (port 3000)
npm run build                  # Production build
npm run lint                   # Run ESLint

# Database
npx prisma migrate dev         # Run migrations
npx prisma studio              # Visual database browser
npx prisma db seed             # Seed database (npm run db:seed also works)
npx prisma generate            # Regenerate Prisma client

# Testing
npx playwright test            # E2E tests
npx tsc --noEmit               # Type check
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Database client | `src/lib/db.ts` |
| YouTube utilities | `src/lib/youtube.ts` |
| Type definitions | `src/types/index.ts` |
| Video submission form | `src/components/video/VideoSubmitForm.tsx` |
| Video player (embed) | `src/components/video/VideoPlayer.tsx` |
| Videos API | `src/app/api/videos/route.ts` |
| Acts API | `src/app/api/acts/route.ts` |

---

## Notes

- This is a personal project with potential to become a formal proposal to FSU Circus leadership
- The tornado disruption narrative is central to the value proposition
- Keep V1 scope tight - resist feature creep
- YouTube-only for video hosting is a firm constraint
- Database is PostgreSQL running locally (see `.env` for connection)
