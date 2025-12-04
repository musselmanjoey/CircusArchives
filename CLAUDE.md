# Circus Video Archive

YouTube-based video archive for FSU Flying High Circus alumni.

## Commands
```bash
npm run dev              # Dev server (port 3000)
npm run build            # Production build
npx playwright test      # E2E tests
npx tsc --noEmit         # Type check
npx prisma migrate dev   # Run migrations
npx prisma studio        # Visual DB browser
```

## Key Files
- `src/lib/youtube.ts` - YouTube URL validation (ALWAYS use `extractYouTubeId`, `isValidYouTubeUrl`)
- `src/lib/db.ts` - Prisma client singleton
- `src/lib/auth.ts` - NextAuth configuration
- `prisma/schema.prisma` - Database schema (source of truth)
- `src/types/index.ts` - TypeScript types

## Conventions
- Named exports: `export const ComponentName = () => {}`
- Components <150 lines, split if larger
- API routes: `src/app/api/[resource]/route.ts`
- Tests: `tests/e2e/[feature].spec.ts`
- Mobile-first: test at 375px width
- snake_case DB columns, camelCase TypeScript

## Version Status
- V1 ✅ Core MVP (videos, acts, browse/search)
- V2 🔄 Auth + Performer Tagging (NextAuth, name login, tag performers)
- V3 Planned: Voting
- V4 Planned: Comments
- V5 Planned: OAuth + Email invites

## IMPORTANT
- YouTube-only video hosting (firm constraint)
- No console.log in production
- Run `npx tsc --noEmit` before commits
- Use TDD: write Playwright tests first for new features
