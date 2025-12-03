# V2 Features Test Specification

This document outlines all features implemented in V2 that need testing before each deploy.

## V1 Features (Baseline - Must Continue Working)

### Video Browsing
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Browse page loads | `/videos` | Shows video grid with thumbnails |
| Filter by act | `/videos` + select act | Filters videos to selected act category |
| Search videos | `/videos` + search term | Filters videos by title/description |
| Video detail page | `/videos/[id]` | Shows video player + metadata |
| YouTube embed works | `/videos/[id]` | iframe loads YouTube video |

### Video Submission (V1)
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Form displays | `/submit` | Shows YouTube URL, title, year, description, act select |
| Invalid URL rejected | Submit invalid URL | Shows validation error |
| Valid submission | Submit valid YouTube URL | Creates video, redirects to `/videos` |

---

## V2 Features (Authentication)

### Login Flow
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Login page loads | `/login` | Shows first name + last name form |
| Empty fields rejected | Submit empty form | Button disabled / validation error |
| New user created | Login with new name | Creates user in DB, redirects to home |
| Existing user logged in | Login with existing name | Finds user, redirects to home |
| Session persists | Navigate after login | Header shows user name |

### Navigation Auth State
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Not logged in - Sign In button | Any page | Header shows "Sign In" button |
| Logged in - User name shown | Any page | Header shows "[First] [Last]" |
| Logged in - Sign Out button | Any page | Header shows "Sign Out" button |
| Sign out works | Click Sign Out | Returns to home, shows Sign In button |

### Protected Routes
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Submit requires login | `/submit` (not logged in) | Shows "Sign In Required" card |
| Submit redirect after login | Click "Sign In to Continue" | Goes to `/login?callbackUrl=/submit` |
| After login redirects back | Complete login from submit | Returns to `/submit` with form |
| Logged in can submit | `/submit` (logged in) | Shows form with "Submitting as [Name]" |

### API Authentication
| Test | Endpoint | Expected Behavior |
|------|----------|-------------------|
| POST /api/videos requires auth | POST without session | Returns 401 "Authentication required" |
| POST /api/videos with auth | POST with valid session | Creates video with uploaderId |
| GET /api/videos public | GET without session | Returns videos (no auth required) |

---

## V2 Features (Performer Tagging)

### User Search API
| Test | Endpoint | Expected Behavior |
|------|----------|-------------------|
| GET /api/users with query | GET /api/users?q=John | Returns matching users by name |
| GET /api/users empty query | GET /api/users | Returns all users (up to 20) |
| POST /api/users requires auth | POST without session | Returns 401 "Authentication required" |
| POST /api/users creates user | POST with firstName/lastName | Creates new user, returns user data |
| POST /api/users finds existing | POST with existing name | Returns existing user (no duplicate) |

### Performer Selector UI
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Performer field visible | `/submit` (logged in) | Shows "Performers (optional)" field |
| Search shows results | Type name in performer field | Dropdown shows matching users |
| Select performer | Click search result | Adds performer chip to selection |
| Remove performer | Click X on chip | Removes performer from selection |
| Add new performer | Click "+ Add new performer" | Shows first/last name form |
| Create new performer | Fill and submit new performer form | Creates user, adds to selection |
| Submit with performers | Submit video with performers | Video saved with performer associations |

### Video Detail Page Performers
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Shows performers | `/videos/[id]` with performers | Displays "Performers" section with names |
| No performers section | `/videos/[id]` without performers | Performers section not shown |

---

## Database Schema (V2)

### New Tables
- `users` - id, first_name, last_name, email, image, timestamps
- `accounts` - OAuth account links (for future Facebook)
- `sessions` - Session tokens (for DB sessions, not used with JWT)
- `video_performers` - video_id, user_id, created_at (many-to-many join table)

### Updated Tables
- `videos.uploader_id` - Optional FK to users table
- `videos` now has `performers` relation through video_performers

---

## Environment Variables Required

| Variable | Required For |
|----------|--------------|
| `DATABASE_URL` | PostgreSQL connection |
| `AUTH_SECRET` | NextAuth.js session encryption |
| `AUTH_TRUST_HOST` | Trust proxy headers |

---

## Playwright Test Files

Existing tests to update:
- `tests/e2e/video-submission.spec.ts` - Add auth flow tests
- `tests/e2e/video-browsing.spec.ts` - Should still work without auth
- `tests/e2e/video-player.spec.ts` - Should still work without auth

New tests needed:
- `tests/e2e/auth.spec.ts` - Login, logout, session persistence
- `tests/e2e/protected-routes.spec.ts` - Submit page protection

---

## Manual Test Checklist

Before each deploy, verify:

- [ ] Can browse videos without login
- [ ] Can view individual video without login
- [ ] Cannot access submit form without login
- [ ] Login with new name creates user
- [ ] Login with existing name finds user
- [ ] After login, header shows name
- [ ] After login, can access submit form
- [ ] Submitting video associates with logged-in user
- [ ] Sign out clears session
- [ ] After sign out, cannot access submit form
