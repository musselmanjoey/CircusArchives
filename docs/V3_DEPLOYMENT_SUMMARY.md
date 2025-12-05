# V3 Deployment Summary

This document summarizes all V3 changes that need to be deployed.

## Commits to Deploy

```
089c3ef feat: Add V3 voting system
<test-commit> test: Add comprehensive V3 voting tests
```

---

## Database Migrations

One new migration needs to be applied:

1. `20251204143449_add_voting_system` - Votes table with unique constraint per user/act

**Run on production:**
```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

**New Tables:**
- `votes` - User votes (id, user_id, video_id, act_id, timestamps)
  - Unique constraint on (user_id, act_id) - one vote per user per act
  - Foreign keys to users, videos, and acts (all CASCADE on delete)

---

## Environment Variables

No new environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth.js session encryption (from V2)

---

## New Features

### Voting System
- Users can vote for their favorite video in each act category
- One vote per user per act (can switch vote to different video)
- Performer bonus: votes from performers in that video count as 2x
- Vote button on video detail page (requires login)
- "Remove vote" option to unvote

### Voters List Modal
- Click vote count to see who voted
- Shows voter names with initials avatar
- Displays "Performer (2x vote)" badge for performers
- Modal closes via X button or backdrop click

### Rankings Homepage
- Homepage now shows "Best Circus Performances" rankings
- "Top Voted Performances" section for acts with votes
- "More Acts" section for acts needing votes
- Each card shows: thumbnail, #1 Best badge, year, vote count, performers

### Navigation Update
- New nav order: Best Videos → Browse → Submit Video
- "Best Videos" links to homepage (/)
- Active state highlighting on current page

---

## New Files

```
src/app/api/votes/route.ts              # POST to cast/switch vote
src/app/api/votes/me/route.ts           # GET current user's votes
src/app/api/votes/[actId]/route.ts      # DELETE to remove vote
src/app/api/rankings/route.ts           # GET rankings by act
src/app/api/videos/[id]/voters/route.ts # GET voters for a video
src/components/voting/VoteButton.tsx    # Vote/unvote button
src/components/voting/VotersList.tsx    # Voters modal component
src/components/voting/VoteInfo.tsx      # Wrapper combining button + list
tests/e2e/voting.spec.ts                # Comprehensive E2E tests (49 tests)
docs/V3_VOTING_TEST_SPEC.md             # Test specification document
```

---

## Modified Files

```
prisma/schema.prisma                    # Vote model + relations
src/app/page.tsx                        # Rankings homepage (replaces simple welcome)
src/app/videos/[id]/page.tsx            # Added VoteInfo component
src/components/layout/Navigation.tsx    # Updated nav order + labels
src/types/index.ts                      # New types (Vote, ActRanking, VoteWithDetails)
```

---

## API Endpoints

### POST /api/votes
- **Auth:** Required
- **Body:** `{ videoId: string }`
- **Returns:** 201 (new vote) or 200 (switched vote)
- **Errors:** 400 (missing videoId), 401 (unauthorized), 404 (video not found)

### GET /api/votes/me
- **Auth:** Required
- **Returns:** Array of user's votes with video/act details
- **Errors:** 401 (unauthorized)

### DELETE /api/votes/[actId]
- **Auth:** Required
- **Returns:** 200 (deleted)
- **Errors:** 401 (unauthorized), 404 (vote not found)

### GET /api/rankings
- **Auth:** None required
- **Query:** `?actId=xxx` (optional, filter by act)
- **Returns:** Array of ActRanking objects with topVideo and totalVotes

### GET /api/videos/[id]/voters
- **Auth:** None required
- **Returns:** Array of voters with isPerformer and voteWeight fields
- **Errors:** 404 (video not found)

---

## Post-Deployment Verification

1. **Rankings Page:**
   - [ ] Homepage shows "Best Circus Performances"
   - [ ] Acts with votes show in "Top Voted Performances"
   - [ ] Acts without votes show in "More Acts" section
   - [ ] Clicking a card navigates to video detail

2. **Voting:**
   - [ ] Vote button shows on video detail (when logged in)
   - [ ] Vote button hidden when not logged in
   - [ ] Can cast vote (button changes to "Your Best [Act]")
   - [ ] Can remove vote
   - [ ] Switching vote to different video works

3. **Voters Modal:**
   - [ ] Vote count is clickable
   - [ ] Modal shows list of voters
   - [ ] Performer badge shows for performers
   - [ ] Modal closes with X or backdrop click

4. **Navigation:**
   - [ ] "Best Videos" is first nav item
   - [ ] Links go to correct pages
   - [ ] Active state highlights current page

5. **Performer Bonus:**
   - [ ] Performer voting for their own video shows 2x weight
   - [ ] Rankings calculate weighted votes correctly

---

## Test Coverage

49 E2E tests covering:
- Voting API (cast, switch, remove, validation)
- Rankings API (all acts, specific act, performer bonus)
- Voters List API (list, performer indicator, errors)
- Voting UI (button states, modal, accessibility)
- Rankings Page (layout, badges, performers, sections)
- Navigation (order, active states, links)

Run tests:
```bash
npx playwright test tests/e2e/voting.spec.ts
```

---

## Rollback Plan

If issues occur:

1. **Database:** Migration is additive (new table only), rollback is safe
2. **Code:** Revert to V2 commit
3. **Votes:** If voting breaks, browse/submit still work (voting is enhancement)

---

## Known Issues / Future Work

- V4: Comments system
- V5: OAuth + Email invites
- Consider: Vote analytics/history
- Consider: Leaderboards by year
