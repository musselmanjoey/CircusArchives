# V5 Deployment Summary

This document summarizes all V5 changes that need to be deployed.

## Commits to Deploy

All uncommitted changes in the working directory implementing V5 features:
- Multi-act support (videos can have multiple acts)
- Show type (Home Show vs Callaway Show)
- UI overhaul with FSU branding
- Mobile-responsive design
- Per-act voting

---

## Database Migrations

One new migration needs to be applied:

1. `20241206000000_v5_multi_act_and_show_type` - Multi-act join table and show type

**Run on production:**
```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

**New Enum:**
- `ShowType` - ENUM ('HOME', 'CALLAWAY')

**New Tables:**
- `video_acts` - Many-to-many join table
  - `id` (TEXT) - Primary key
  - `video_id` (TEXT) - Foreign key to videos (CASCADE delete)
  - `act_id` (TEXT) - Foreign key to acts (CASCADE delete)
  - `created_at` - Timestamp
  - UNIQUE constraint on (video_id, act_id)

**Modified Tables:**
- `videos` - Added `show_type` column (ShowType, default 'HOME')
- `videos` - Removed `act_id` column (data migrated to video_acts)

**Data Migration:**
- Existing `act_id` values automatically copied to `video_acts` table
- All existing videos set to `show_type = 'HOME'`

---

## Environment Variables

No new environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth.js session encryption

---

## New Features

### Multi-Act Support
- Videos can now belong to multiple act categories
- Submit form shows act toggle chips (select all that apply)
- Video cards show combined act names: "Act1 / Act2"
- Video detail page shows all acts in title
- Separate voting section for each act
- Filter by act still works (returns videos with that act)

### Show Type
- Required field when submitting videos
- Two options: Home Show or Callaway Show
- Badge displayed on video cards (top-right of thumbnail)
- Badge displayed on video detail page
- Can filter videos by show type
- Default value for existing videos: HOME

### UI Overhaul
- FSU color scheme: Garnet (#782F40) and Gold (#CEB888)
- Consistent styling across all pages
- Design tokens in CSS custom properties
- Updated Button component with variants (primary, gold, danger, outline, ghost)
- Updated Card component with variants (default, elevated, outlined, featured)

### Mobile Responsiveness
- Hamburger menu on mobile viewports
- Slide-out navigation drawer
- Responsive grid layouts
- Mobile-friendly forms
- Touch-friendly button sizes

### Per-Act Voting
- Voting API now requires actId parameter
- Can vote for same video in multiple act categories
- Rankings calculated per-act (video appears in each act's leaderboard)

---

## New Files

```
prisma/migrations/20241206000000_v5_multi_act_and_show_type/migration.sql
docs/V5_FEATURES_TEST_SPEC.md
docs/V5_DEPLOYMENT_SUMMARY.md
```

---

## Modified Files

### Schema & Types
```
prisma/schema.prisma                    # VideoAct model, ShowType enum, Video changes
src/types/index.ts                      # ShowType, VideoAct, updated Video/VideoCreateInput
```

### API Routes
```
src/app/api/videos/route.ts             # Multi-act create/filter, showType
src/app/api/videos/[id]/route.ts        # Multi-act update, showType
src/app/api/rankings/route.ts           # Use VideoAct join table
src/app/api/votes/route.ts              # Require actId parameter
src/app/api/votes/me/route.ts           # Updated includes
```

### Components
```
src/components/video/VideoSubmitForm.tsx    # Multi-act chips, showType dropdown
src/components/video/VideoCard.tsx          # Show type badge, multi-act display
src/components/voting/VoteButton.tsx        # Pass actId to API
src/components/layout/Header.tsx            # Mobile hamburger menu
src/components/layout/Footer.tsx            # FSU themed footer
src/components/ui/Button.tsx                # Added variants, isLoading prop
src/components/ui/Card.tsx                  # Added variants, hoverable prop
```

### Pages
```
src/app/videos/[id]/page.tsx            # Multi-act display, per-act voting, showType badge
src/app/videos/[id]/edit/page.tsx       # Multi-act editing, showType editing
```

### Styles
```
src/app/globals.css                     # FSU design tokens, theme colors
```

---

## API Changes

### POST /api/videos (Breaking Change)
- **Old:** `{ actId: string, ... }`
- **New:** `{ actIds: string[], showType: "HOME" | "CALLAWAY", ... }`
- `actIds` is required and must have at least one act
- `showType` is required

### PATCH /api/videos/[id]
- **New fields:** `actIds?: string[]`, `showType?: "HOME" | "CALLAWAY"`
- When `actIds` provided, replaces all act associations

### POST /api/votes (Breaking Change)
- **Old:** `{ videoId: string }`
- **New:** `{ videoId: string, actId: string }`
- `actId` is now required (since videos can have multiple acts)

### GET /api/videos
- **New filter:** `?showType=HOME` or `?showType=CALLAWAY`
- Act filter unchanged: `?actId=[id]` (uses join table internally)

### Response Changes
- All video responses include `acts` array (VideoAct with nested Act)
- All video responses include `showType` field
- All video responses include legacy `act` field (first act, for backward compat)

---

## Post-Deployment Verification

1. **Multi-Act:**
   - [ ] Can select multiple acts when submitting video
   - [ ] Video title shows all acts separated by "/"
   - [ ] Video appears when filtering by any of its acts
   - [ ] Can edit video to change/add/remove acts
   - [ ] Detail page shows all acts in heading

2. **Show Type:**
   - [ ] Show type dropdown on submit form
   - [ ] Default is "Home Show"
   - [ ] "Callaway Show" option available
   - [ ] Badge visible on video cards
   - [ ] Badge visible on video detail page
   - [ ] Can filter by show type

3. **Voting:**
   - [ ] Voting section shown for each act on multi-act videos
   - [ ] Can vote for same video in different acts
   - [ ] Vote counts correctly in each act's rankings

4. **UI/Mobile:**
   - [ ] FSU Garnet/Gold colors throughout
   - [ ] Hamburger menu appears on mobile
   - [ ] Menu opens/closes properly
   - [ ] All pages usable on mobile
   - [ ] Forms work on mobile

5. **Existing Data:**
   - [ ] Existing videos still display correctly
   - [ ] Existing videos show "Home" badge (default)
   - [ ] Existing act associations preserved

---

## Test Coverage

Playwright tests to cover:
- Multi-act API (CRUD, validation, filtering)
- Multi-act UI (submit, edit, display)
- Show type API (CRUD, filtering)
- Show type UI (form, badges)
- Per-act voting
- Mobile responsiveness

Run tests:
```bash
npx playwright test tests/e2e/v5-*.spec.ts --project=chromium
```

---

## Rollback Plan

If issues occur:

1. **Database:** Migration is mostly additive. Rollback requires:
   - Re-add `act_id` column to videos
   - Copy first video_act back to act_id
   - Drop video_acts table and ShowType enum

2. **Code:** Revert to V4 commit (check git log)

3. **Partial Rollback:**
   - Multi-act: Frontend can work with single act (uses first from array)
   - Show type: Badge display only, doesn't break functionality
   - Mobile: Desktop still works if mobile breaks

---

## Known Issues / Future Work

- V6: OAuth + Email invites (deferred from V5)
- Consider: Act-specific video thumbnails
- Consider: Show year filter (1990-present)
- Consider: Admin bulk-update show types
