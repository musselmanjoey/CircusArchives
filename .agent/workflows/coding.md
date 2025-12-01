---
description: Primary development agent for building Next.js features and components
---

## Coding Guidelines

You are the Coding Agent for the Circus Video Archive, a Next.js 14+ project with TypeScript.

### Tech Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript (strict mode)
- Database: PostgreSQL with Prisma ORM
- Styling: Tailwind CSS
- Video: YouTube embeds only

### Current Focus: V1 MVP

Build these features only:
1. YouTube video embedding with link submission
2. Basic metadata (title, year, description)
3. Act categorization (dynamic, not hardcoded)
4. Simple browse/search interface

**DO NOT implement yet:** Authentication (V2), Voting (V3), Comments/Tags (V4)

### When Creating Components

1. Ask for component name and purpose.
2. Create in appropriate folder:
   - Reusable UI: `src/components/ui/`
   - Video-related: `src/components/video/`
   - Layout: `src/components/layout/`
   - Search: `src/components/search/`

3. Use this structure:

```tsx
'use client'; // Only if needed for interactivity

import { type FC } from 'react';

interface ComponentNameProps {
  // Define props with TypeScript
}

export const ComponentName: FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  return (
    <div className="tailwind-classes">
      {/* Component content */}
    </div>
  );
};
```

4. Export as named export (not default).
5. Keep under 150 lines - split if larger.

### When Creating API Routes

1. Create in `src/app/api/[resource]/route.ts`
2. Use this structure:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.model.findMany();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate input
    const created = await prisma.model.create({ data: body });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create' },
      { status: 500 }
    );
  }
}
```

### YouTube URL Handling

Always use the utility in `src/lib/youtube.ts`:

```typescript
import { extractYouTubeId, isValidYouTubeUrl } from '@/lib/youtube';

// Validate before saving
if (!isValidYouTubeUrl(url)) {
  throw new Error('Invalid YouTube URL');
}

const videoId = extractYouTubeId(url);
```

### Database Operations

1. Read the Prisma schema first: `prisma/schema.prisma`
2. Use the Prisma client from `src/lib/db.ts`
3. Always handle errors gracefully
4. Use transactions for multi-step operations

### Quality Checklist

Before marking any task complete, verify:
- [ ] TypeScript has no errors (`npx tsc --noEmit`)
- [ ] No `console.log` in production code
- [ ] Loading states for async operations
- [ ] Error states with user-friendly messages
- [ ] Mobile-responsive (test at 375px width)
- [ ] Accessibility: proper labels, alt text, semantic HTML

### Quick Commands

// turbo
Run `npm run dev` to start development server

// turbo
Run `npx tsc --noEmit` to check TypeScript

// turbo
Run `npx prisma studio` to view database
