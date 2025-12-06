# V4 Features Test Specification

This document outlines all features implemented in V4 that need testing before each deploy.

## V4 Features Overview

- **Comments System** - 140-character comments on videos (tweet-length)
- **Leaderboard View** - Act-specific video rankings sorted by votes
- **About Page** - Project information and history
- **Support Page** - Developer info with photo and Venmo link
- **Navigation Updates** - Added About link, footer links

---

## V4 Features (Comments API)

### GET /api/comments - Get Comments for Video
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires videoId | GET without videoId | Returns 400 "Video ID is required" |
| Returns comments | GET `?videoId=[id]` | Returns array of comments with user info |
| Empty for no comments | GET (video has no comments) | Returns empty array |
| Ordered by newest | GET (video has comments) | Comments sorted by createdAt desc |

### POST /api/comments - Create Comment
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires authentication | POST without session | Returns 401 "Authentication required" |
| Create comment | POST `{ content, videoId }` | Returns 201, creates comment |
| Reject empty content | POST with empty content | Returns 400 "Comment content is required" |
| Reject over 140 chars | POST with 141+ chars | Returns 400 "Comment must be 140 characters or less" |
| Accept exactly 140 chars | POST with 140 chars | Returns 201, creates comment |
| Reject missing videoId | POST without videoId | Returns 400 "Video ID is required" |
| Reject invalid video | POST with non-existent videoId | Returns 404 "Video not found" |
| Includes user info | POST (success) | Response includes user firstName/lastName |

### PATCH /api/comments/[id] - Update Comment
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires authentication | PATCH without session | Returns 401 "Authentication required" |
| Update own comment | PATCH `{ content }` | Returns 200, updates comment |
| Reject empty content | PATCH with empty content | Returns 400 "Comment content is required" |
| Reject over 140 chars | PATCH with 141+ chars | Returns 400 "Comment must be 140 characters or less" |
| Reject editing others' comment | PATCH another user's comment | Returns 403 "You can only edit your own comments" |
| Reject non-existent comment | PATCH invalid id | Returns 404 "Comment not found" |

### DELETE /api/comments/[id] - Delete Comment
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires authentication | DELETE without session | Returns 401 "Authentication required" |
| Delete own comment | DELETE own comment | Returns 200 "Comment deleted successfully" |
| Reject deleting others' comment | DELETE another user's comment | Returns 403 "You can only delete your own comments" |
| Reject non-existent comment | DELETE invalid id | Returns 404 "Comment not found" |

---

## V4 Features (Leaderboard API)

### GET /api/videos - Sort by Votes
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Sort by votes | GET `?actId=[id]&sort=votes` | Returns videos sorted by vote count (highest first) |
| Performer bonus included | Performer voted on video | Vote counts as 2 in sort order |
| Pagination works | GET `?sort=votes&page=2` | Returns correct page of sorted results |
| Default sort unchanged | GET without sort param | Returns videos sorted by createdAt desc |

---

## V4 Features (Comments UI)

### Comment Section on Video Page
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Section visible | `/videos/[id]` | Shows "Comments (N)" heading |
| Comment count shown | Video has comments | Heading shows count e.g. "Comments (5)" |
| Form visible when logged in | `/videos/[id]` (logged in) | Shows textarea and Post button |
| Login prompt when logged out | `/videos/[id]` (not logged in) | Shows "Log in to leave a comment" |
| Character counter | Type in textarea | Shows remaining characters (140 - length) |
| Counter turns yellow | Under 20 chars remaining | Counter shows yellow |
| Counter turns red | Over limit | Counter shows negative number in red |
| Post button disabled | Empty or over limit | Post button is disabled |
| Submit comment | Type and click Post | Comment appears in list, form clears |
| Comments display author | Comment in list | Shows "FirstName LastName" |
| Comments display date | Comment in list | Shows formatted date |

### Comment Edit/Delete
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Edit button visible for owner | Own comment | Shows Edit button |
| Delete button visible for owner | Own comment | Shows Delete button |
| No buttons for others | Another user's comment | No Edit/Delete buttons |
| Click Edit | Click Edit on own comment | Transforms to edit form |
| Cancel edit | Click Cancel in edit form | Returns to comment view, no changes |
| Save edit | Edit text and Save | Comment updates, exits edit mode |
| Delete with confirm | Click Delete | Shows confirm dialog |
| Confirm delete | Accept confirm dialog | Comment removed from list |
| Cancel delete | Decline confirm dialog | Comment remains |

---

## V4 Features (Leaderboard UI)

### Homepage Act Links
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Acts link to leaderboard | Click act on `/` | Navigates to `/videos?actId=[id]&sort=votes` |
| Voted acts link correctly | Click act with votes | Same navigation, sorted by votes |
| Unvoted acts link correctly | Click act without votes | Same navigation with sort param |

### Browse Page Leaderboard Mode
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Leaderboard title | `/videos?actId=[id]&sort=votes` | Shows "[Act Name] Leaderboard" heading |
| Leaderboard subtitle | `/videos?actId=[id]&sort=votes` | Shows "Videos ranked by community votes. Performer votes count double!" |
| Videos sorted by votes | Leaderboard mode | Videos displayed highest votes first |
| Normal title | `/videos` (no sort param) | Shows "Browse Videos" heading |
| Filters still work | Add year filter in leaderboard | Filters apply to sorted results |

---

## V4 Features (About Page)

### About Page Content
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Page loads | `/about` | Shows "About the Circus Video Archive" heading |
| FSU history shown | `/about` | Mentions FSU Flying High Circus and 1947 |
| How It Works section | `/about` | Shows numbered steps (Browse, Vote, Contribute, Connect) |
| Built by alumni section | `/about` | Shows community/alumni messaging |
| Browse Videos button | `/about` | Links to `/` |
| Support button | `/about` | Links to `/support` |

---

## V4 Features (Support Page)

### Support Page Content
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Page loads | `/support` | Shows "Support the Developer" heading |
| Developer photo | `/support` | Shows IMG_0641.jpeg image |
| Developer intro | `/support` | Shows "Hey, I'm Joey!" |
| Venmo section | `/support` | Shows "Support via Venmo" heading |
| Venmo button | `/support` | Links to venmo.com/Joey-Musselman |
| Venmo handle | `/support` | Shows "@Joey-Musselman" |
| Other ways to help | `/support` | Lists sharing, submitting, tagging, feedback |
| About link | `/support` | Links to `/about` |

---

## V4 Features (Navigation)

### Header Navigation
| Test | Path | Expected Behavior |
|------|------|-------------------|
| About link visible | Any page | Nav shows "About" link |
| Nav order correct | Any page | Shows "Best Videos" → "Browse" → "Submit Video" → "About" |
| About link works | Click "About" | Navigates to `/about` |
| About highlighted | On `/about` | "About" link has active styling |

### Footer Navigation
| Test | Path | Expected Behavior |
|------|------|-------------------|
| About link in footer | Any page | Footer shows "About" link |
| Support link in footer | Any page | Footer shows "Support the Developer" link |
| Footer About works | Click footer About | Navigates to `/about` |
| Footer Support works | Click footer Support | Navigates to `/support` |

---

## Database Schema (V4)

### New Tables
- `comments` - id, content (varchar 140), user_id, video_id, timestamps
  - Content limited to 140 characters (tweet-length)

### Relations
- `comments.user_id` → `users.id` (cascade delete)
- `comments.video_id` → `videos.id` (cascade delete)

---

## Playwright Test Files

New/updated tests:
- `tests/e2e/comments.spec.ts` - Comments API and UI tests
- `tests/e2e/v4-features.spec.ts` - Leaderboard, About, Support page tests

Test categories to cover:
1. Comments API (CRUD operations, validation, auth)
2. Comments UI (form, counter, edit/delete)
3. Leaderboard API (sort by votes)
4. Leaderboard UI (title, subtitle, sorting)
5. About Page (content, links)
6. Support Page (content, photo, Venmo link)
7. Navigation (header About link, footer links)

---

## Manual Test Checklist

Before each deploy, verify:

### Comments
- [ ] Can post a comment when logged in
- [ ] Cannot post when logged out (shows login prompt)
- [ ] Character counter works (140 limit)
- [ ] Cannot submit empty or over-limit comment
- [ ] Comment shows author name and date
- [ ] Can edit own comment
- [ ] Can delete own comment (with confirmation)
- [ ] Cannot edit/delete others' comments

### Leaderboard
- [ ] Clicking act on homepage goes to leaderboard view
- [ ] Leaderboard shows act name in title
- [ ] Videos sorted by vote count (highest first)
- [ ] Performer bonus affects sort order

### About Page
- [ ] Page loads at `/about`
- [ ] Content mentions FSU Flying High Circus
- [ ] "How It Works" section present
- [ ] Links to homepage and support page work

### Support Page
- [ ] Page loads at `/support`
- [ ] Developer photo displays
- [ ] Venmo button links to correct profile
- [ ] @Joey-Musselman handle shown

### Navigation
- [ ] "About" link in header navigation
- [ ] Footer shows About and Support links
- [ ] All navigation links work correctly
