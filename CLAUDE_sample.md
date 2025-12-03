# Circus Video Archive - Claude Code Project Guide

## Project Overview

A YouTube-based video archive platform for FSU Flying High Circus alumni to preserve, share, and celebrate historical performance videos. Following the tornado that damaged the circus tent and caused multi-year disruption, significant institutional knowledge was lost. This platform recaptures that knowledge as a gift to the performer community.

### Core Concept
- YouTube-first video hosting (embedded links only, no self-hosted video)
- Alumni-only access via email invite system  
- Videos organized by year and act type
- Community voting for best performances
- Comments, tagging, and performer identification

### Tech Stack
- **Frontend:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS
- **Testing:** Playwright for E2E, Jest for unit tests
- **Video:** YouTube embeds only

---

## Version Roadmap

Features grouped to minimize context switching:

| Version | Focus | Features |
|---------|-------|----------|
| **V1 (Current)** | Core Archive MVP | YouTube embedding, video submission, browse/search, act categorization |
| V2 | Authentication | Email invites, user registration, alumni verification |
| V3 | Voting System | One vote per user, rankings by act, yearly aggregation |
| V4 | Community Features | Comments, trick tagging, performer identification |

**Important:** Only implement V1 features unless explicitly asked otherwise.

---

## Project Structure

```
circus-video-archive/
├── CLAUDE.md                    # This file
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── api/                 # API routes
│   │   ├── videos/              # Video browsing pages
│   │   └── submit/              # Video submission
│   ├── components/
│   │   ├── ui/                  # Reusable UI (Button, Input, Card)
│   │   ├── video/               # VideoCard, VideoPlayer, VideoGrid
│   │   ├── layout/              # Header, Footer, Navigation
│   │   └── search/              # SearchBar, FilterPanel, YearFilter
│   ├── lib/
│   │   ├── db.ts                # Prisma client
│   │   ├── youtube.ts           # YouTube URL parsing/validation
│   │   └── utils.ts             # General utilities
│   └── types/
│       └── index.ts             # TypeScript types
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
├── tests/
│   ├── e2e/                     # Playwright tests
│   ├── unit/                    # Jest tests
│   └── features/                # Gherkin feature files
└── docs/
    ├── business/                # Business proposal documents
    └── API.md                   # API documentation
```

---

## Work Modes

When working on this project, I may ask you to focus on specific areas. Here are the modes and their guidelines:

---

### 🔧 CODING MODE

Use when: Building features, components, API routes, database work.

#### Guidelines

**Components:**
- Use functional components with hooks
- Prefer named exports: `export const ComponentName = () => {}`
- Keep components under 150 lines - split if larger
- Place reusable UI in `src/components/ui/`
- Use TypeScript interfaces for all props

**API Routes:**
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
Always use the utility functions in `src/lib/youtube.ts`:
```typescript
import { extractYouTubeId, isValidYouTubeUrl } from '@/lib/youtube';

if (!isValidYouTubeUrl(url)) {
  throw new Error('Invalid YouTube URL');
}
const videoId = extractYouTubeId(url);
```

**Quality Checklist:**
- [ ] TypeScript has no errors (`npx tsc --noEmit`)
- [ ] No `console.log` in production code
- [ ] Loading states for async operations
- [ ] Error states with user-friendly messages
- [ ] Mobile-responsive (test at 375px width)
- [ ] Semantic HTML and proper accessibility

---

### 🧪 TESTING MODE

Use when: Writing tests, running test suites, debugging test failures.

#### Playwright E2E Tests

**Location:** `tests/e2e/`

**Test Structure:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/relevant-page');
  });

  test('should do expected behavior', async ({ page }) => {
    // Arrange - setup
    // Act - perform action
    await page.click('[data-testid="submit-button"]');
    // Assert - verify result
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

**Priority Tests for V1:**
1. Video submission flow (valid/invalid YouTube URLs)
2. Video browsing and display
3. Search and filtering by act/year
4. YouTube embed loading

**Commands:**
```bash
npx playwright test              # Run all tests
npx playwright test [file]       # Run specific file
npx playwright test --ui         # Interactive UI mode
npx playwright test --debug      # Debug mode
npx playwright codegen [url]     # Generate tests by recording
```

**Naming Convention:** `[feature].spec.ts` (e.g., `video-submission.spec.ts`)

---

### 📝 DOCUMENTATION MODE

Use when: Writing docs, README files, API documentation, code comments.

#### Guidelines

**Technical Docs (in `/docs/`):**
- Architecture decisions and rationale
- API endpoint documentation
- Database schema documentation

**Code Documentation:**
- JSDoc comments for complex functions
- Inline comments for non-obvious logic
- README in each major directory if helpful

**Format:**
- Use Markdown
- Include code examples
- Add Mermaid diagrams for complex flows

---

### 💼 BUSINESS MODE

Use when: Competitive research, proposal writing, value proposition work.

#### Current Landscape (From Research)

**Official FSU Sites:**
- `circus.fsu.edu` - Basic info, no video archive
- `fsucircusalumni.com` - Alumni profiles, no video features
- Oral History Project - Audio/text only, no video

**University Archives:**
- DigiNole, FSU Archives, Florida Memory have scattered historical records
- Focused on documents/photos, not video
- Not easily accessible to general alumni

#### Gap Analysis

| They Have | We Add |
|-----------|--------|
| Oral histories (audio) | Video archive |
| Static photos in archives | Searchable, browsable collection |
| Current show promotion | Historical preservation |
| Alumni profiles | Community voting and recognition |
| Scattered records | Centralized, organized platform |

#### Key Talking Points

1. **Knowledge Preservation Crisis** - Tornado disruption caused institutional knowledge loss
2. **Low Cost** - YouTube hosts videos free, minimal infrastructure
3. **Community Driven** - Alumni contribute and curate content
4. **Complements Existing Efforts** - Works alongside Oral History Project
5. **Unique Asset** - One of only two collegiate circuses in the US

#### Output Location
Save business docs to `/docs/business/`:
- `COMPETITIVE_ANALYSIS.md`
- `GAP_ANALYSIS.md`
- `EXECUTIVE_SUMMARY.md`
- `VALUE_PROPOSITION.md`
- `ROADMAP.md`

---

### 👥 USER MANAGEMENT MODE

Use when: FAQ development, admin workflows, support documentation.

#### FAQ Topics to Draft

1. How do I submit a video?
2. What YouTube URL formats are supported?
3. How do I report an incorrect video?
4. Who can access the archive?
5. How do I get an invite? (V2)

#### Output Location
- `/docs/FAQ.md`
- `/docs/admin/` (admin guides)
- `/docs/templates/` (email templates for V2)

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
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # Run ESLint

# Database
npx prisma migrate dev         # Run migrations
npx prisma studio              # Visual database browser
npx prisma db seed             # Seed database

# Testing
npx playwright test            # E2E tests
npm test                       # Unit tests
npx tsc --noEmit               # Type check

# Utilities
npx prisma generate            # Regenerate Prisma client
```

---

## How to Use This File

When starting work, tell me which mode you're in:

- "Let's work on **coding** - I need to build the video submission form"
- "Switch to **testing mode** - write Playwright tests for the search feature"
- "**Business mode** - help me draft the executive summary"
- "**Documentation** - update the API docs for the new endpoint"

I'll follow the relevant guidelines for that mode.

---

## Notes

- This is a personal project with potential to become a formal proposal to FSU Circus leadership
- The tornado disruption narrative is central to the value proposition
- Keep V1 scope tight - resist feature creep
- YouTube-only for video hosting is a firm constraint
