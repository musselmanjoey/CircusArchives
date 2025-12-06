# V4 Deployment Summary

This document summarizes all V4 changes that need to be deployed.

## Commits to Deploy

All uncommitted changes in the working directory implementing V4 features:
- Comments system (API + UI)
- About page
- Support page
- Navigation updates
- Leaderboard view
- E2E tests

---

## Database Migrations

One new migration needs to be applied:

1. `20251205193120_add_comments` - Comments table with 140-char limit

**Run on production:**
```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

**New Tables:**
- `comments` - User comments on videos
  - `id` (TEXT) - Primary key
  - `content` (VARCHAR 140) - Tweet-length comment
  - `user_id` (TEXT) - Foreign key to users (CASCADE delete)
  - `video_id` (TEXT) - Foreign key to videos (CASCADE delete)
  - `created_at` / `updated_at` - Timestamps

---

## Environment Variables

No new environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth.js session encryption

---

## New Features

### Comments System
- Users can post 140-character comments on videos (tweet-length)
- Character counter shows remaining characters
- Counter turns yellow under 20 chars, red when over limit
- Edit own comments (inline edit form)
- Delete own comments (with confirmation dialog)
- Comments sorted newest first
- Shows author name and formatted date

### About Page (`/about`)
- "About the Circus Video Archive" heading
- FSU Flying High Circus history (since 1947)
- "How It Works" section with numbered steps
- "Built by Alumni, for Alumni" section
- Links to Browse Videos and Support page

### Support Page (`/support`)
- "Support the Developer" heading
- Developer photo and introduction ("Hey, I'm Joey!")
- Venmo donation section with @Joey-Musselman handle
- "Other Ways to Help" list (share, submit, tag, feedback)
- Link back to About page

### Leaderboard View
- Homepage act cards link to `/videos?actId=[id]&sort=votes`
- Leaderboard shows "[Act Name] Leaderboard" title
- Subtitle: "Videos ranked by community votes. Performer votes count double!"
- Videos sorted by vote count (highest first)
- Performer 2x bonus included in sort

### Navigation Updates
- Added "About" link to main navigation
- Nav order: Best Videos → Browse → Submit Video → About
- Footer links: About | Support the Developer
- Active state highlighting on About page

---

## New Files

```
src/app/about/page.tsx                  # About page
src/app/support/page.tsx                # Support page
src/app/api/comments/route.ts           # GET/POST comments
src/app/api/comments/[id]/route.ts      # PATCH/DELETE comment
src/components/comments/CommentForm.tsx # Comment input form
src/components/comments/CommentItem.tsx # Single comment display
src/components/comments/CommentSection.tsx # Comments container
tests/e2e/comments.spec.ts              # Comments E2E tests (30 tests)
tests/e2e/v4-features.spec.ts           # V4 features E2E tests (23 tests)
public/IMG_0641.jpeg                    # Developer photo
docs/V4_FEATURES_TEST_SPEC.md           # Test specification
```

---

## Modified Files

```
prisma/schema.prisma                    # Comment model + relations
src/app/page.tsx                        # Act cards link to leaderboard
src/app/videos/page.tsx                 # Leaderboard title/subtitle
src/app/videos/[id]/page.tsx            # Added CommentSection
src/components/layout/Navigation.tsx    # Added About link
src/components/layout/Footer.tsx        # Added About + Support links
src/types/index.ts                      # Comment types
```

---

## API Endpoints

### GET /api/comments
- **Auth:** None required
- **Query:** `?videoId=xxx` (required)
- **Returns:** Array of comments with user info, sorted newest first
- **Errors:** 400 (missing videoId)

### POST /api/comments
- **Auth:** Required
- **Body:** `{ content: string, videoId: string }`
- **Returns:** 201 with created comment
- **Errors:** 400 (empty/too long/missing videoId), 401 (unauthorized), 404 (video not found)

### PATCH /api/comments/[id]
- **Auth:** Required
- **Body:** `{ content: string }`
- **Returns:** 200 with updated comment
- **Errors:** 400 (empty/too long), 401 (unauthorized), 403 (not owner), 404 (not found)

### DELETE /api/comments/[id]
- **Auth:** Required
- **Returns:** 200 "Comment deleted successfully"
- **Errors:** 401 (unauthorized), 403 (not owner), 404 (not found)

### GET /api/videos (updated)
- **Query:** `?sort=votes` enables leaderboard mode
- **Returns:** Videos sorted by vote count (with performer 2x bonus)

---

## Post-Deployment Verification

1. **Comments:**
   - [ ] Can post comment when logged in
   - [ ] Cannot post when logged out (shows "Log in to leave a comment")
   - [ ] Character counter works (shows remaining out of 140)
   - [ ] Counter turns yellow under 20 chars
   - [ ] Counter turns red when over 140
   - [ ] Cannot submit empty or over-limit comment
   - [ ] Comment shows author name and date
   - [ ] Can edit own comment
   - [ ] Can delete own comment (with confirmation)
   - [ ] Cannot edit/delete others' comments

2. **Leaderboard:**
   - [ ] Clicking act on homepage goes to `/videos?actId=xxx&sort=votes`
   - [ ] Page shows "[Act Name] Leaderboard" title
   - [ ] Shows "Performer votes count double!" subtitle
   - [ ] Videos sorted by vote count

3. **About Page:**
   - [ ] Page loads at `/about`
   - [ ] Shows FSU Flying High Circus content
   - [ ] "How It Works" section visible
   - [ ] Browse Videos button works
   - [ ] Support button works

4. **Support Page:**
   - [ ] Page loads at `/support`
   - [ ] Developer photo displays
   - [ ] "Hey, I'm Joey!" text visible
   - [ ] Venmo button links to venmo.com/Joey-Musselman
   - [ ] @Joey-Musselman handle shown
   - [ ] About link works

5. **Navigation:**
   - [ ] "About" link in header nav
   - [ ] Footer shows About and Support links
   - [ ] All navigation links work correctly
   - [ ] About highlighted when on /about

---

## Test Coverage

53 E2E tests covering:
- Comments API (CRUD, validation, auth, ownership)
- Comments UI (form, counter, edit/delete, display)
- Leaderboard API (sort by votes)
- Leaderboard UI (title, subtitle, sorting)
- About Page (content, links)
- Support Page (content, photo, Venmo)
- Navigation (header, footer, active states)

Run tests:
```bash
npx playwright test tests/e2e/comments.spec.ts tests/e2e/v4-features.spec.ts --project=chromium
```

---

## Rollback Plan

If issues occur:

1. **Database:** Migration is additive (new table only), rollback is safe
2. **Code:** Revert to V3 commit (8fb19e3)
3. **Comments:** If comments break, all other features still work (comments are enhancement)
4. **Static pages:** About/Support are static, very low risk

---

## Known Issues / Future Work

- V5: OAuth + Email invites
- Consider: Comment notifications
- Consider: Admin comment moderation
- Consider: Comment replies/threading
