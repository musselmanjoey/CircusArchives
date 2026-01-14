# Circus Video Archive

YouTube-based video archive for FSU Flying High Circus alumni.

## Commands
```bash
npm run dev              # Dev server (port 3000)
npm run build            # Production build
npm run queue:process    # Process upload queue (uses .env.production)
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
- `scripts/process-upload-queue.ts` - Local queue processor (legacy, for manual runs)
- `scripts/process-queue-gh.py` - GitHub Actions queue processor (automated)
- `.github/workflows/process-queue.yml` - GH Action: triggers on upload or every 2hrs
- `tools/youtube/scripts/upload.py` - Python YouTube upload script (local use)

## Conventions
- Named exports: `export const ComponentName = () => {}`
- Components <150 lines, split if larger
- API routes: `src/app/api/[resource]/route.ts`
- Tests: `tests/e2e/[feature].spec.ts`
- Mobile-first: test at 375px width
- snake_case DB columns, camelCase TypeScript

## Version Status
- V1 ✅ Core MVP (videos, acts, browse/search)
- V2 ✅ Auth + Performer Tagging (NextAuth, name login, tag performers)
- V3 ✅ Voting (one vote per act, performer 2x bonus, rankings homepage)
- V4 ✅ Comments + Leaderboard + About/Support (140-char comments, act leaderboards, static pages)
- V5 ✅ Multi-Act + Show Type + UI Overhaul (multi-act videos, Home/Callaway shows, FSU branding, mobile-responsive)
- V6 ✅ Video Upload System (client-side Vercel Blob upload, automated GitHub Actions processing, YouTube upload)
- V7 Planned: OAuth + Email invites

## Pre-Commit Checklist
Before every commit, verify:
1. `git status` - no `.env*`, credentials, or secrets staged
2. `npx tsc --noEmit` - no type errors
3. No `console.log` in production code

Never commit: `.env.vercel`, `.env.local`, `client_secret*.json`, API keys, tokens

## IMPORTANT
- YouTube-only video hosting (firm constraint)
- No console.log in production
- Use TDD: write Playwright tests first for new features
