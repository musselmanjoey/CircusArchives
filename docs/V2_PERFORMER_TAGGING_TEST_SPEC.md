# V2 Performer Tagging - Test Specification

This document specifies the performer tagging feature implemented in V2 for the Circus Video Archive. Use this to create Playwright E2E tests.

## Feature Overview

Users can tag performers (other users) when submitting videos. Performers are displayed on video detail pages. The system allows:
- Searching existing users by name
- Creating new performer entries
- Selecting multiple performers per video
- Viewing tagged performers on video pages

---

## API Endpoints

### GET /api/users

**Purpose:** Search for users by name

**Authentication:** None required (public endpoint)

**Query Parameters:**
- `q` (optional): Search query string

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    }
  ]
}
```

**Test Cases:**
| Test | Request | Expected |
|------|---------|----------|
| Empty query returns users | `GET /api/users` | 200, returns array of users (up to 20) |
| Query filters by first name | `GET /api/users?q=John` | 200, returns users with "John" in firstName |
| Query filters by last name | `GET /api/users?q=Smith` | 200, returns users with "Smith" in lastName |
| Case insensitive search | `GET /api/users?q=john` | 200, matches "John", "JOHN", etc. |
| No matches returns empty | `GET /api/users?q=zzzznonexistent` | 200, returns `{ "data": [] }` |

---

### POST /api/users

**Purpose:** Create a new user (for performer tagging)

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Doe"
  }
}
```

**Test Cases:**
| Test | Condition | Expected |
|------|-----------|----------|
| Creates new user | Valid body, authenticated | 201, returns new user |
| Returns existing user | Name already exists | 200, returns existing user (no duplicate) |
| Missing firstName | `{ "lastName": "Doe" }` | 400, error message |
| Missing lastName | `{ "firstName": "Jane" }` | 400, error message |
| Not authenticated | No session | 401, "Authentication required" |

---

### POST /api/videos (Updated)

**Purpose:** Create video with optional performers

**Authentication:** Required

**Request Body (with performers):**
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Test Performance",
  "year": 2024,
  "actId": "act-uuid",
  "description": "Optional description",
  "performerIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Test Cases:**
| Test | Condition | Expected |
|------|-----------|----------|
| Video with performers | Valid performerIds array | 201, video includes performers in response |
| Video without performers | No performerIds field | 201, video created (performers optional) |
| Empty performers array | `performerIds: []` | 201, video created with no performers |
| Invalid performer ID | Non-existent UUID | 500 or 400, foreign key error |

---

### GET /api/videos/[id] (Updated)

**Purpose:** Get video details including performers

**Response now includes:**
```json
{
  "data": {
    "id": "video-uuid",
    "title": "Performance Title",
    "performers": [
      {
        "id": "video-performer-uuid",
        "videoId": "video-uuid",
        "userId": "user-uuid",
        "user": {
          "id": "user-uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## UI Components

### Performer Selector Component

**Location:** Submit page (`/submit`) - visible only when logged in

**Elements:**
- Label: "Performers (optional)"
- Search input with placeholder: "Search for performers..."
- Helper text: "Search for existing performers or add new ones"
- Dropdown with search results
- Selected performers displayed as removable chips
- "Add new performer" option when no results found

**Test Cases:**

| Test | Action | Expected |
|------|--------|----------|
| Field visibility | Navigate to `/submit` logged in | "Performers (optional)" field visible |
| Search triggers API | Type "John" in search field | API call to `/api/users?q=John` after 300ms debounce |
| Results dropdown | Type name with matches | Dropdown shows matching user names |
| Select performer | Click user in dropdown | User added as chip, dropdown closes, input clears |
| Multiple performers | Select multiple users | Multiple chips displayed |
| Remove performer | Click X on chip | Performer removed from selection |
| No results message | Search with no matches | Shows "No performers found" |
| Add new option | Search with no matches | Shows "+ Add new performer" button |
| New performer form | Click "+ Add new performer" | Shows first name and last name inputs |
| Create performer | Fill and submit new performer form | Creates user via API, adds to selection |
| Cancel new performer | Click "Cancel" | Hides new performer form |

---

### Video Detail Page Performers

**Location:** `/videos/[id]`

**Test Cases:**

| Test | Condition | Expected |
|------|-----------|----------|
| Performers section shown | Video has performers | "Performers" heading with purple name chips |
| Performers section hidden | Video has no performers | No "Performers" section rendered |
| Multiple performers | Video has 3 performers | All 3 names displayed as chips |
| Performer name format | Performer data | Shows "FirstName LastName" |

---

## E2E Test Scenarios

### Scenario 1: Submit Video with Existing Performer

**Preconditions:**
- User is logged in
- At least one other user exists in database

**Steps:**
1. Navigate to `/submit`
2. Fill in YouTube URL, title, year, act
3. Type partial name in performer search
4. Select user from dropdown
5. Submit form

**Expected:**
- Video created with performer association
- Redirected to videos page
- Video detail page shows tagged performer

---

### Scenario 2: Submit Video with New Performer

**Preconditions:**
- User is logged in

**Steps:**
1. Navigate to `/submit`
2. Fill in required video fields
3. Search for non-existent name
4. Click "+ Add new performer"
5. Enter first name and last name
6. Click "Add"
7. Submit form

**Expected:**
- New user created in database
- Video created with performer association
- Video detail page shows new performer

---

### Scenario 3: Submit Video with Multiple Performers

**Steps:**
1. Add first performer (existing)
2. Add second performer (new)
3. Add third performer (existing)
4. Remove second performer
5. Submit form

**Expected:**
- Video created with 2 performers
- Video detail page shows both performers

---

## Database Tables

### video_performers

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| video_id | UUID | FK to videos |
| user_id | UUID | FK to users |
| created_at | DateTime | Auto-set |

**Constraints:**
- Unique constraint on (video_id, user_id) - prevents duplicate tagging
- Cascade delete on video deletion
- Cascade delete on user deletion

---

## Test Data Setup

For E2E tests, ensure:

1. **Test users exist:**
   - User for login (e.g., "Test User")
   - Users to search for (e.g., "John Smith", "Jane Doe", "Bob Johnson")

2. **Test act exists:**
   - At least one act for video submission

3. **Cleanup:**
   - Delete test videos after each test
   - Consider deleting test-created performers

---

## File Locations

| File | Purpose |
|------|---------|
| `src/app/api/users/route.ts` | User search and creation API |
| `src/app/api/videos/route.ts` | Video creation with performers |
| `src/app/api/videos/[id]/route.ts` | Video detail with performers |
| `src/components/video/PerformerSelector.tsx` | Performer search/select UI |
| `src/components/video/VideoSubmitForm.tsx` | Submit form with performer selector |
| `src/app/videos/[id]/page.tsx` | Video detail page with performers |
| `prisma/schema.prisma` | VideoPerformer model |
