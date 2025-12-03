# V2 UI Improvements - Test Specification

This document specifies the UI improvements and video edit functionality added in V2 for testing.

## Features Overview

1. Updated act list (24 FSU circus acts)
2. Video title removed (auto-generated from act + year)
3. Performer names displayed on video cards
4. Performer filter on browse page
5. Video edit functionality (owner only)
6. Keyboard navigation in performer selector

---

## 1. Act List Updates

### Seed Data
The following 24 acts should exist in the database:

- Flying Trapeze, Juggling, Russian Bar, Teeterboard, Quartet Adagio
- Skating, Bike for Five, Clowning, Jump Rope, Hand Balancing
- Rolla, Slack Rope, Tight Wire, Low Casting, Triple Trapeze
- Double Trapeze, Swinging Trapeze, Cloud Swing, Chinese Pole, Web
- Cradle, Sky Pole, Unicycle, Trampoline

### Test Cases
| Test | Expected |
|------|----------|
| Act dropdown on submit | Shows all 24 acts |
| Act filter on browse | Shows all 24 acts in dropdown |
| Old acts removed | No "Aerial Silks", "Contortion", "Fire", etc. |

---

## 2. Video Title Auto-Generation

### Behavior
- Title field removed from submit form
- Title auto-generated as "{Act Name} {Year}" (e.g., "Flying Trapeze 2024")
- Search now searches description and act name (not title)

### Test Cases
| Test | Path | Expected |
|------|------|----------|
| No title field on submit | `/submit` | Form has no "Title" input |
| Video created with auto-title | Submit video | Video title = "{Act} {Year}" |
| Video card shows act name | `/videos` | Card heading is act name, not title |
| Video detail shows act name | `/videos/[id]` | Heading is act name |
| Search by act name | `/videos?search=Trapeze` | Finds videos with "Trapeze" acts |
| Search by description | `/videos?search=keyword` | Finds videos with keyword in description |

---

## 3. Performer Display on Video Cards

### Behavior
- Video cards on `/videos` show performer names below act name
- Performers shown as comma-separated list
- Line clamped to 1 line if too long

### Test Cases
| Test | Expected |
|------|----------|
| Card shows performers | Video card displays "John Doe, Jane Smith" |
| Card without performers | No performer line shown |
| Long performer list | Text truncated with ellipsis |

---

## 4. Performer Filter on Browse Page

### API Changes
- `GET /api/videos` now accepts `performerId` query param
- `GET /api/videos` response includes `performers` array

### UI Elements
- New "Performer" dropdown in filter panel
- Options: "All Performers" + list of all users
- Selecting performer filters videos to those they appear in

### Test Cases
| Test | Path | Expected |
|------|------|----------|
| Performer dropdown exists | `/videos` | Filter panel has "Performer" select |
| All performers option | `/videos` | First option is "All Performers" |
| Filter by performer | Select performer | Only videos with that performer shown |
| Clear performer filter | Select "All Performers" | Shows all videos again |
| API with performerId | `GET /api/videos?performerId=xxx` | Returns filtered videos |

---

## 5. Video Edit Functionality

### Authorization
- Only video owner (uploaderId matches session user) can edit
- Admin role can also edit (future-proofing)
- Non-owners see video normally without edit/delete buttons

### Edit Page (`/videos/[id]/edit`)
| Element | Behavior |
|---------|----------|
| Year dropdown | Pre-filled with current year |
| Act dropdown | Pre-filled with current act |
| Performer selector | Pre-filled with current performers |
| Description textarea | Pre-filled with current description |
| Save button | Submits PATCH request |
| Cancel button | Returns to video detail |

### Video Detail Page (`/videos/[id]`)
| Element | Condition | Behavior |
|---------|-----------|----------|
| Edit button | Owner only | Links to `/videos/[id]/edit` |
| Delete button | Owner only | Confirms then deletes video |
| No buttons | Not owner | Edit/Delete buttons hidden |

### API: PATCH /api/videos/[id]

**Request:**
```json
{
  "year": 2024,
  "actId": "uuid",
  "description": "Updated description",
  "performerIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Authorization:**
- 401 if not authenticated
- 403 if not owner/admin
- 404 if video not found

**Behavior:**
- Updates specified fields
- Replaces all performers (delete old, create new)
- Auto-updates title if act or year changed

### Test Cases

#### Edit Page Access
| Test | Condition | Expected |
|------|-----------|----------|
| Owner can access edit | Logged in as uploader | Edit page loads with form |
| Non-owner blocked | Logged in as different user | Shows "not authorized" message |
| Not logged in blocked | No session | Shows "sign in required" |

#### Edit Form
| Test | Action | Expected |
|------|--------|----------|
| Form pre-filled | Load edit page | All fields have current values |
| Change year | Select new year | Year updates on save |
| Change act | Select new act | Act and title update on save |
| Add performer | Search and select | Performer added to video |
| Remove performer | Click X on chip | Performer removed from video |
| Update description | Type new text | Description updates on save |
| Save success | Click Save | Redirects to video detail |
| Cancel | Click Cancel | Returns to video detail, no changes |

#### Edit/Delete Buttons on Detail Page
| Test | Condition | Expected |
|------|-----------|----------|
| Owner sees buttons | Logged in as uploader | Edit and Delete buttons visible |
| Non-owner no buttons | Logged in as other user | No Edit/Delete buttons |
| Guest no buttons | Not logged in | No Edit/Delete buttons |
| Delete confirms | Click Delete | Browser confirm dialog |
| Delete cancels | Click Cancel in confirm | Video not deleted |
| Delete succeeds | Confirm delete | Video deleted, redirect to /videos |

#### PATCH API
| Test | Request | Expected |
|------|---------|----------|
| Update year | `{ "year": 2020 }` | Video year changed to 2020 |
| Update act | `{ "actId": "new-id" }` | Video act changed, title updated |
| Update performers | `{ "performerIds": [...] }` | Old performers removed, new added |
| Update description | `{ "description": "new" }` | Description updated |
| Clear description | `{ "description": "" }` | Description set to null |
| Not authenticated | No session | 401 error |
| Not owner | Different user session | 403 error |
| Video not found | Invalid ID | 404 error |

---

## 6. Keyboard Navigation in Performer Selector

### Behavior
- Arrow Down: Move highlight to next item
- Arrow Up: Move highlight to previous item
- Enter: Select highlighted item
- Escape: Close dropdown
- Mouse hover: Also highlights item

### Visual
- Highlighted item has blue background (`bg-blue-100`)
- Non-highlighted items have white background

### Test Cases
| Test | Action | Expected |
|------|--------|----------|
| Arrow down highlights first | Press Down | First result highlighted |
| Arrow down moves down | Press Down twice | Second result highlighted |
| Arrow up moves up | Down, Down, Up | First result highlighted |
| Enter selects | Down, Enter | Highlighted performer selected |
| Escape closes | Type, Escape | Dropdown closes |
| Mouse hover highlights | Hover over item | Item becomes highlighted |

---

## E2E Test Scenarios

### Scenario 1: Edit Video as Owner

**Preconditions:**
- User logged in
- User has uploaded a video

**Steps:**
1. Navigate to owned video detail page
2. Verify Edit button is visible
3. Click Edit
4. Change year to different value
5. Add a performer
6. Update description
7. Click Save

**Expected:**
- Redirected to video detail
- Year is updated
- New performer shown
- Description is updated

---

### Scenario 2: Cannot Edit Others' Videos

**Preconditions:**
- User A uploads a video
- User B logs in

**Steps:**
1. User B navigates to User A's video
2. Check for Edit button

**Expected:**
- No Edit or Delete buttons visible
- Navigating directly to `/videos/[id]/edit` shows "not authorized"

---

### Scenario 3: Filter Videos by Performer

**Preconditions:**
- Videos exist with tagged performers
- At least one performer has multiple videos

**Steps:**
1. Navigate to `/videos`
2. Open Performer filter dropdown
3. Select a performer with videos
4. Verify filtered results

**Expected:**
- Only videos featuring that performer are shown
- Selecting "All Performers" shows all videos again

---

### Scenario 4: Delete Video as Owner

**Preconditions:**
- User logged in with an uploaded video

**Steps:**
1. Navigate to owned video
2. Click Delete
3. Cancel the confirmation
4. Click Delete again
5. Confirm the deletion

**Expected:**
- First cancel: Video still exists
- Confirm delete: Redirected to `/videos`, video is gone

---

## File Locations

| File | Purpose |
|------|---------|
| `prisma/seed.ts` | Updated act list |
| `src/app/api/videos/route.ts` | Video list with performers, no title validation |
| `src/app/api/videos/[id]/route.ts` | PATCH endpoint for updates |
| `src/app/videos/[id]/edit/page.tsx` | Video edit page |
| `src/app/videos/[id]/page.tsx` | Video detail with edit/delete buttons |
| `src/app/videos/page.tsx` | Browse page with performer filter |
| `src/components/video/VideoCard.tsx` | Card showing act name + performers |
| `src/components/video/VideoSubmitForm.tsx` | Form without title field |
| `src/components/video/PerformerSelector.tsx` | Keyboard navigation |
| `src/components/search/FilterPanel.tsx` | Performer filter dropdown |

---

## Test Data Cleanup

**Important:** Tests should clean up created users and videos after each test run. The performer filter shows all users, so test users will appear in production if not cleaned up.

Suggested cleanup pattern:
```typescript
test.afterEach(async () => {
  // Delete test videos by title pattern
  // Delete test users by name pattern
});
```
