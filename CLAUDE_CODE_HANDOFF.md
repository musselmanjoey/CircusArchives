# Claude Code Handoff: Circus Video Archive Project Setup

## Your Task

Set up the complete folder structure and boilerplate files for a Next.js project called "Circus Video Archive." This project will be opened in Google Antigravity IDE afterward for multi-agent development, so focus on creating a clean foundation with proper configuration files.

---

## Project Context

This is a digital archive platform for circus performers to preserve and celebrate historical performance videos. Following a tornado that damaged the circus tent and caused a multi-year disruption, significant institutional knowledge was lost. This platform aims to recapture that knowledge as a gift to the performer community.

**Core concept:**
- YouTube-first video hosting (embedded links only, no self-hosted video)
- Alumni-only access via email invite system
- Videos organized by year and act type
- Community voting for best performances
- Comments, tagging, and performer identification

---

## Tech Stack

- **Frontend:** Next.js 14+ with React (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (with Prisma ORM)
- **Styling:** Tailwind CSS
- **Video:** YouTube embeds only
- **Testing:** Jest + React Testing Library + Gherkin/Cucumber for BDD

---

## Folder Structure to Create

```
circus-video-archive/
├── .agent/                          # Antigravity agent configuration
│   ├── rules/
│   │   └── project-rules.md
│   └── workflows/
│       ├── coding.md
│       ├── business-plan.md
│       ├── documentation.md
│       ├── testing.md
│       └── user-management.md
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── videos/
│   │   │   ├── page.tsx             # Browse/search videos
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Single video view
│   │   ├── submit/
│   │   │   └── page.tsx             # Video submission form
│   │   └── api/
│   │       ├── videos/
│   │       │   └── route.ts
│   │       └── acts/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Card.tsx
│   │   ├── video/
│   │   │   ├── VideoCard.tsx
│   │   │   ├── VideoPlayer.tsx      # YouTube embed wrapper
│   │   │   ├── VideoGrid.tsx
│   │   │   └── VideoSubmitForm.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   └── search/
│   │       ├── SearchBar.tsx
│   │       ├── FilterPanel.tsx
│   │       └── YearFilter.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                    # Prisma client
│   │   ├── youtube.ts               # YouTube URL parsing/validation
│   │   └── utils.ts                 # General utilities
│   │
│   └── types/
│       └── index.ts                 # TypeScript types
│
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Seed data for development
│
├── docs/
│   ├── README.md                    # Project documentation
│   ├── ARCHITECTURE.md              # Technical architecture
│   ├── API.md                       # API documentation
│   └── business/
│       ├── PROPOSAL.md              # Business proposal draft
│       ├── VALUE_PROPOSITION.md
│       └── ROADMAP.md
│
├── tests/
│   ├── unit/
│   │   └── .gitkeep
│   ├── integration/
│   │   └── .gitkeep
│   └── features/                    # Gherkin feature files
│       ├── video-submission.feature
│       ├── video-browsing.feature
│       └── search.feature
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## File Contents to Generate

### 1. `.agent/rules/project-rules.md`

```markdown
# Circus Video Archive - Project Rules

## Project Mission
Preserve circus performance history by creating a community-driven video archive. This platform serves as a gift to the performer community following the tornado disruption that caused significant institutional knowledge loss.

## Tech Stack
- Next.js 14+ with App Router
- TypeScript (strict mode)
- PostgreSQL with Prisma ORM
- Tailwind CSS for styling
- YouTube embeds only (no self-hosted video)

## Code Style Guidelines
- Use functional components with hooks
- Prefer named exports over default exports
- Keep components focused and under 150 lines
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Handle errors gracefully with user-friendly messages

## Database Conventions
- Use UUID for all primary keys
- Include created_at and updated_at timestamps on all tables
- Use snake_case for database columns
- Use camelCase for TypeScript/JavaScript

## Component Structure
- Place reusable UI in src/components/ui/
- Feature-specific components in their own folders
- Co-locate tests with components when possible

## Version Focus (V1 MVP)
Current focus is V1 - Core Video Archive:
- YouTube video embedding with link submission
- Basic metadata (title, year, description)
- Act categorization (dynamic, not hardcoded)
- Simple browse/search interface

DO NOT implement yet:
- Authentication (V2)
- Voting system (V3)
- Comments or tagging (V4)
```

### 2. `.agent/workflows/coding.md`

```markdown
# Coding Agent Workflow

## Role
Primary development agent for implementing features, components, and API routes.

## Current Focus: V1 MVP
Build the core video archive functionality:
1. YouTube video embedding and display
2. Video submission form
3. Browse/search interface
4. Act categorization

## Guidelines
- Start with the data model (Prisma schema)
- Build API routes before frontend components
- Create reusable UI components first
- Test YouTube URL parsing thoroughly
- Use server components where possible, client components only when needed

## YouTube Integration
- Parse YouTube URLs to extract video IDs
- Support multiple URL formats (youtube.com, youtu.be, with timestamps)
- Use lite-youtube-embed or similar for performance
- Validate URLs before database insertion

## Quality Checklist
- [ ] TypeScript strict mode passing
- [ ] No console.log in production code
- [ ] Error boundaries for component failures
- [ ] Loading states for async operations
- [ ] Mobile-responsive layouts
```

### 3. `.agent/workflows/business-plan.md`

```markdown
# Business Plan Agent Workflow

## Role
Develop documentation for presenting this project to circus leadership as a formal proposal.

## Deliverables
1. Executive summary (one-pager)
2. Value proposition document
3. Implementation roadmap with costs
4. ROI analysis for the circus organization

## Key Talking Points
- Knowledge preservation after tornado disruption
- Community engagement and alumni connection
- Low cost (YouTube hosting, minimal infrastructure)
- Scalable from MVP to full platform
- Potential for sponsorship/partnership revenue

## Research Tasks
- Compare to similar community archive projects
- Estimate hosting/infrastructure costs
- Identify potential funding sources
- Document volunteer vs paid development options

## Output Location
All business documentation goes in /docs/business/
```

### 4. `.agent/workflows/documentation.md`

```markdown
# Documentation Agent Workflow

## Role
Create and maintain technical documentation, API docs, and user guides.

## Documentation Types

### Technical Docs (/docs/)
- Architecture decisions and rationale
- API endpoint documentation
- Database schema documentation
- Deployment guides

### Code Documentation
- JSDoc comments for complex functions
- README files in each major directory
- Inline comments for non-obvious logic

### User Documentation (future)
- How to submit a video
- How to search/browse
- FAQ for common issues

## Standards
- Use Markdown for all docs
- Include code examples where helpful
- Keep docs updated as code changes
- Add diagrams for complex flows (Mermaid preferred)

## Priority for V1
1. README.md (project overview)
2. ARCHITECTURE.md (technical decisions)
3. API.md (endpoint documentation)
```

### 5. `.agent/workflows/testing.md`

```markdown
# Testing Agent Workflow

## Role
Create and maintain tests using Jest, React Testing Library, and Gherkin/Cucumber for BDD.

## Testing Strategy

### Unit Tests (/tests/unit/)
- Utility functions (YouTube URL parsing, etc.)
- Individual component rendering
- API route handlers

### Integration Tests (/tests/integration/)
- API endpoints with database
- Form submissions
- Search functionality

### Feature Tests (/tests/features/)
- Gherkin .feature files for BDD
- User journey scenarios
- Acceptance criteria verification

## Priority Tests for V1
1. YouTube URL parsing and validation
2. Video submission flow
3. Search/filter functionality
4. Video display and embedding

## Gherkin Example Format
```gherkin
Feature: Video Submission
  As a circus alumni
  I want to submit a YouTube video
  So that it can be preserved in the archive

  Scenario: Submit valid YouTube URL
    Given I am on the video submission page
    When I enter a valid YouTube URL
    And I fill in the title and year
    And I select an act category
    Then the video should be added to the archive
```

## Commands
- `npm test` - Run all tests
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage report
```

### 6. `.agent/workflows/user-management.md`

```markdown
# User Management Agent Workflow

## Role
Handle administrative tasks, FAQ development, and future support automation.

## Current Scope (Pre-V2)
- Draft FAQ content based on anticipated questions
- Document admin workflows
- Plan alumni verification process
- Design email templates for invites

## FAQ Topics to Draft
1. How do I submit a video?
2. What YouTube URL formats are supported?
3. How do I report an incorrect video?
4. Who can access the archive?
5. How do I get an invite?

## Future Scope (V2+)
- Alumni invite system administration
- Account issue resolution
- Automated email processing
- AI-assisted FAQ responses

## Output Location
- FAQ drafts: /docs/FAQ.md
- Admin guides: /docs/admin/
- Email templates: /docs/templates/
```

### 7. `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// V1 MVP Tables

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

  // Future relations (V2+)
  // uploaderId String?  @map("uploader_id")
  // uploader   User?    @relation(fields: [uploaderId], references: [id])
  // votes      Vote[]
  // comments   Comment[]
  // tags       VideoTag[]
  // performers VideoPerformer[]

  @@map("videos")
}

// V2+ Tables (commented out for now)
// model User {
//   id            String   @id @default(uuid())
//   email         String   @unique
//   passwordHash  String   @map("password_hash")
//   alumniVerified Boolean @default(false) @map("alumni_verified")
//   createdAt     DateTime @default(now()) @map("created_at")
//   updatedAt     DateTime @updatedAt @map("updated_at")
// }
```

### 8. `src/types/index.ts`

```typescript
// Video types
export interface Video {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  year: number;
  description?: string;
  actId: string;
  act?: Act;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoCreateInput {
  youtubeUrl: string;
  title: string;
  year: number;
  description?: string;
  actId: string;
}

// Act types
export interface Act {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Search/Filter types
export interface VideoFilters {
  actId?: string;
  year?: number;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
```

### 9. `src/lib/youtube.ts`

```typescript
/**
 * YouTube URL parsing and validation utilities
 */

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

/**
 * Validate if a string is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

/**
 * Get embed URL for a YouTube video
 */
export function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get thumbnail URL for a YouTube video
 */
export function getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'max' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    max: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
```

### 10. `.env.example`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/circus_archive?schema=public"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Future: Authentication (V2)
# NEXTAUTH_SECRET=""
# NEXTAUTH_URL="http://localhost:3000"
```

### 11. `tests/features/video-submission.feature`

```gherkin
Feature: Video Submission
  As a circus community member
  I want to submit YouTube videos to the archive
  So that performances can be preserved for future generations

  Background:
    Given the archive has the following acts:
      | name          |
      | Juggling      |
      | Aerial Silks  |
      | Trapeze       |

  Scenario: Successfully submit a valid YouTube video
    Given I am on the video submission page
    When I enter the YouTube URL "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    And I enter the title "Amazing Juggling Performance"
    And I enter the year "2019"
    And I select the act "Juggling"
    And I click submit
    Then I should see a success message
    And the video should appear in the archive

  Scenario: Submit video with youtu.be short URL
    Given I am on the video submission page
    When I enter the YouTube URL "https://youtu.be/dQw4w9WgXcQ"
    And I fill in the required fields
    And I click submit
    Then the video should be added successfully

  Scenario: Reject invalid YouTube URL
    Given I am on the video submission page
    When I enter the YouTube URL "https://vimeo.com/12345"
    And I click submit
    Then I should see an error message "Please enter a valid YouTube URL"
```

### 12. `README.md` (project root)

```markdown
# Circus Video Archive

A community-driven platform for preserving and celebrating circus performance history.

## Mission

Following the tornado that damaged the circus tent and caused a multi-year disruption, significant institutional knowledge was lost. This platform aims to recapture that knowledge and give it back to the performer community as a lasting gift.

## Features (V1 MVP)

- 🎬 YouTube video embedding and display
- 📝 Video submission with metadata (title, year, description)
- 🎪 Act categorization (dynamic categories)
- 🔍 Browse and search interface

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library + Cucumber

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start development server
npm run dev
```

## Project Structure

```
src/
├── app/          # Next.js App Router pages
├── components/   # React components
├── lib/          # Utility functions
└── types/        # TypeScript types

prisma/           # Database schema and migrations
docs/             # Documentation
tests/            # Test files
.agent/           # Antigravity agent configuration
```

## Version Roadmap

- **V1:** Core Video Archive (MVP) ← Current
- **V2:** Authentication & Alumni Verification
- **V3:** Voting System
- **V4:** Community Features (Comments, Tags)

## Development

This project uses Google Antigravity IDE with multi-agent workflows. See `.agent/` for agent configurations.

## License

Private - Circus Community Use Only
```

---

## Commands to Run After Setup

```bash
# Initialize the project
cd circus-video-archive
npm install

# Initialize Prisma
npx prisma init
npx prisma generate

# Verify TypeScript
npx tsc --noEmit

# Run dev server to test
npm run dev
```

---

## Notes for Claude Code

1. **Create all folders first** before adding files
2. **Use the exact file paths** specified in the structure
3. **Initialize with `npx create-next-app@latest`** using these options:
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - src/ directory: Yes
   - App Router: Yes
   - Import alias: @/*
4. **After scaffolding**, add the additional folders and files listed above
5. **Don't implement full functionality** - just create the file structure with basic boilerplate
6. The `.agent/` folder is for Google Antigravity configuration - create it even though it's not standard Next.js
