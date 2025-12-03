# V2 Deployment Summary

This document summarizes all V2 changes that need to be deployed.

## Commits to Deploy

```
76bcb88 feat: Add V2 performer tagging on video submissions
bda77af feat: UI improvements and video edit functionality
```

Plus any test commits from the testing agent.

---

## Database Migrations

Two new migrations need to be applied:

1. `20251203160401_add_auth_tables` - Auth tables (User, Account, Session) + uploaderId on Video
2. `20251203182645_add_video_performers` - VideoPerformer join table

**Run on production:**
```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

**New Tables:**
- `users` - User accounts (id, first_name, last_name, email, image, timestamps)
- `accounts` - OAuth account links (for future Facebook auth)
- `sessions` - Session tokens (not used with JWT strategy)
- `video_performers` - Many-to-many join (video_id, user_id)

**Updated Tables:**
- `videos` - Added `uploader_id` FK to users

---

## Environment Variables

New required variables for production:

| Variable | Purpose | Example |
|----------|---------|---------|
| `AUTH_SECRET` | NextAuth.js session encryption | Generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Trust proxy headers | `true` |

Existing:
- `DATABASE_URL` - PostgreSQL connection string

---

## New Features

### Authentication
- Name-based login (first name + last name)
- JWT session strategy
- Login page at `/login`
- Session provider wrapping app
- Protected routes (submit requires login)

### Performer Tagging
- Tag performers when submitting videos
- Search existing users or create new performers
- Performers displayed on video cards and detail pages
- Filter videos by performer on browse page

### Video Edit (Owner Only)
- Edit button on video detail page (owner only)
- Edit page at `/videos/[id]/edit`
- Can update: year, act, performers, description
- Delete button with confirmation
- PATCH endpoint with ownership check

### UI Changes
- 24 FSU circus acts (replaced placeholder acts)
- Video title removed (auto-generated as "Act Year")
- Performer names shown on video cards
- Performer filter dropdown on browse page
- Keyboard navigation in performer selector

---

## New Files

```
src/lib/auth.ts                      # NextAuth configuration
src/app/api/auth/[...nextauth]/route.ts  # Auth API routes
src/app/login/page.tsx               # Login page
src/components/Providers.tsx         # SessionProvider wrapper
src/app/api/users/route.ts           # User search/create API
src/components/video/PerformerSelector.tsx  # Performer picker component
src/app/videos/[id]/edit/page.tsx    # Video edit page
src/types/next-auth.d.ts             # NextAuth type extensions
```

---

## Modified Files

```
prisma/schema.prisma                 # New models + relations
prisma/seed.ts                       # Updated act list
src/app/layout.tsx                   # Wrapped with Providers
src/app/submit/page.tsx              # Protected route + uploader display
src/app/videos/page.tsx              # Performer filter
src/app/videos/[id]/page.tsx         # Edit/delete buttons, client component
src/app/api/videos/route.ts          # Performers in response, no title required
src/app/api/videos/[id]/route.ts     # PATCH + DELETE with auth
src/components/layout/Navigation.tsx # Login/logout UI
src/components/video/VideoCard.tsx   # Shows performers
src/components/video/VideoSubmitForm.tsx  # No title, has performers
src/components/search/FilterPanel.tsx    # Performer filter
src/types/index.ts                   # New types
```

---

## Seed Data

Run seed to update acts:
```bash
DATABASE_URL="<production-url>" npx prisma db seed
```

This will:
- Add 24 FSU circus acts
- Use upsert (won't duplicate existing)

**Note:** Old placeholder acts (Aerial Silks, Contortion, Fire, etc.) may need manual deletion if they have no videos attached.

---

## Post-Deployment Verification

1. **Auth Flow:**
   - [ ] Can access `/login`
   - [ ] Can login with first/last name
   - [ ] Header shows user name after login
   - [ ] Can sign out

2. **Protected Routes:**
   - [ ] `/submit` requires login
   - [ ] Redirects to login, then back to submit

3. **Video Submission:**
   - [ ] Can submit video with performers
   - [ ] Video shows uploader name
   - [ ] Video shows performers

4. **Video Edit:**
   - [ ] Owner sees Edit/Delete buttons
   - [ ] Non-owner doesn't see buttons
   - [ ] Edit page works
   - [ ] Delete works with confirmation

5. **Browse/Filter:**
   - [ ] Performer filter works
   - [ ] Act filter has 24 acts
   - [ ] Video cards show performers

---

## Rollback Plan

If issues occur:

1. **Database:** Migrations are additive (new tables/columns), so rollback is safe
2. **Code:** Revert to previous commit
3. **Auth:** If auth breaks, users can't submit but can still browse (public)

---

## Known Issues / Future Work

- Test users may appear in performer dropdown if E2E tests don't clean up
- Name matching for performers deferred to V6
- Facebook OAuth ready to add (commented in auth.ts)
