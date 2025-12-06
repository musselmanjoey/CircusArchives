# V5 Features Test Specification

This document outlines all features implemented in V5 that need testing before each deploy.

## V5 Features Overview

- **Multi-Act Support** - Videos can now belong to multiple act categories
- **Show Type** - Videos must specify Home Show or Callaway Show
- **UI Overhaul** - FSU branding with Garnet/Gold colors, mobile-responsive design
- **Per-Act Voting** - Voting section shown for each act on multi-act videos

---

## V5 Features (Multi-Act API)

### POST /api/videos - Create Video with Multiple Acts
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires actIds array | POST without actIds | Returns 400 "At least one act category is required" |
| Requires showType | POST without showType | Returns 400 "Show type is required" |
| Create with single act | POST `{ actIds: [id], showType: "HOME", ... }` | Returns 201, creates video with one act |
| Create with multiple acts | POST `{ actIds: [id1, id2], ... }` | Returns 201, video appears in both act categories |
| Invalid act rejected | POST with non-existent actId | Returns 400 "One or more invalid act categories" |
| Title generated from acts | POST with multiple acts | Title is "Act1 / Act2 Year" |
| ShowType stored | POST with showType | Video has correct showType |

### GET /api/videos - Filter by Act
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Filter by single act | GET `?actId=[id]` | Returns videos that have this act |
| Multi-act video appears | Video has acts A and B, filter by A | Video appears in results |
| Multi-act video appears | Video has acts A and B, filter by B | Video also appears in these results |
| Filter by showType | GET `?showType=HOME` | Returns only Home Show videos |
| Filter by showType | GET `?showType=CALLAWAY` | Returns only Callaway Show videos |
| Combined filters | GET `?actId=[id]&showType=HOME` | Returns videos matching both |

### PATCH /api/videos/[id] - Update Video Acts
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Update acts | PATCH `{ actIds: [newId1, newId2] }` | Replaces all act associations |
| Update showType | PATCH `{ showType: "CALLAWAY" }` | Updates showType field |
| Empty actIds rejected | PATCH `{ actIds: [] }` | Maintains existing acts (no change) |
| Invalid act rejected | PATCH with non-existent actId | Returns 400 "One or more invalid act categories" |
| Title updated | PATCH with new actIds | Title regenerated from new acts + year |

### GET /api/videos/[id] - Get Single Video
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Returns acts array | GET video with multiple acts | Response includes `acts` array with act details |
| Returns showType | GET any video | Response includes `showType` field |
| Legacy act field | GET any video | Response includes `act` (first act for backward compat) |

---

## V5 Features (Voting with Multi-Act)

### POST /api/votes - Vote on Video for Specific Act
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires actId | POST `{ videoId }` only | Returns 400 "Act ID is required" |
| Vote for specific act | POST `{ videoId, actId }` | Creates vote for that video+act combination |
| Video must have act | POST with actId video doesn't have | Returns 404 "Video not found or does not have this act" |
| One vote per act | Vote twice for same act | Updates existing vote (doesn't create duplicate) |
| Different act votes | Vote for video in act A, then act B | Two separate votes (one per act) |

### GET /api/rankings - Rankings by Act
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Rankings for act | GET `?actId=[id]` | Returns videos with that act, sorted by votes |
| Multi-act video ranked | Video has acts A and B | Appears in rankings for both A and B |
| Vote counts correct | Vote for video in act A | Vote counts in act A ranking, not act B |

---

## V5 Features (Show Type UI)

### Video Submit Form
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Show type required | `/submit` | Show Type dropdown visible |
| Default is Home Show | `/submit` | "Home Show" selected by default |
| Options available | `/submit` | Shows "Home Show" and "Callaway Show" options |
| Selection persists | Select Callaway, submit | Video created with CALLAWAY showType |

### Video Card Display
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Show type badge | `/videos` | Each card shows "Home" or "Callaway" badge |
| Badge position | Video card | Badge in top-right corner of thumbnail |
| Home badge style | Home Show video | Shows "Home" text |
| Callaway badge style | Callaway Show video | Shows "Callaway" text |

### Video Detail Page
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Show type displayed | `/videos/[id]` | Shows "Home Show" or "Callaway Show" badge |
| Badge with icon | `/videos/[id]` | Badge has building icon |
| Badge styling | `/videos/[id]` | Garnet background with appropriate colors |

---

## V5 Features (Multi-Act UI)

### Video Submit Form
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Multi-select acts | `/submit` | Acts displayed as toggle chips/buttons |
| Select multiple | `/submit` | Can select 2+ acts simultaneously |
| Checkmark on selected | `/submit` | Selected acts show checkmark icon |
| Deselect act | Click selected act | Act deselected, removed from selection |
| Validation message | No acts selected | Shows "Please select at least one act" |
| Multi-act hint | 2+ acts selected | Shows "This video will appear in N act categories" |

### Video Edit Form
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Load existing acts | `/videos/[id]/edit` | Current acts pre-selected |
| Load existing showType | `/videos/[id]/edit` | Current show type selected |
| Multi-select works | Edit form | Can add/remove acts |
| Save updates | Edit and save | Acts and showType updated |

### Video Card Display
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Multiple acts shown | Video with 2 acts | Title shows "Act1 / Act2" |
| Single act shown | Video with 1 act | Title shows just act name |

### Video Detail Page
| Test | Path | Expected Behavior |
|------|------|-------------------|
| All acts in title | `/videos/[id]` | Heading shows "Act1 / Act2" |
| Vote section per act | Multi-act video | Shows separate voting for each act |
| Vote independently | Multi-act video | Can vote for same video in different acts |

---

## V5 Features (UI Overhaul)

### Color Theme
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Garnet primary color | Any page | Primary buttons/accents are FSU Garnet (#782F40) |
| Gold accent color | Any page | Secondary accents are FSU Gold (#CEB888) |
| Consistent styling | All pages | Same color scheme throughout |

### Mobile Responsiveness
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Hamburger menu | Mobile viewport | Shows hamburger icon instead of nav links |
| Menu opens | Click hamburger | Slide-out menu with all nav links |
| Menu closes | Click link or outside | Menu closes |
| Cards stack | Mobile viewport | Video cards stack vertically |
| Form fits | `/submit` on mobile | Form fields full-width, usable |

### Header Navigation
| Test | Path | Expected Behavior |
|------|------|-------------------|
| FSU branding | Any page | Header has garnet styling |
| Mobile hamburger | < 768px width | Shows hamburger menu |
| Desktop nav | >= 768px width | Shows horizontal nav links |

### Footer
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Multi-column layout | Desktop | Footer columns for navigation/info |
| Stacked on mobile | Mobile viewport | Footer sections stack vertically |
| FSU themed | Any page | Garnet/gold color scheme |

---

## Database Schema (V5)

### New Enum
- `ShowType` - ENUM ('HOME', 'CALLAWAY')

### New Tables
- `video_acts` - Join table for many-to-many Video <-> Act relationship
  - `id` (TEXT) - Primary key
  - `video_id` (TEXT) - Foreign key to videos (CASCADE delete)
  - `act_id` (TEXT) - Foreign key to acts (CASCADE delete)
  - `created_at` - Timestamp
  - UNIQUE constraint on (video_id, act_id)

### Modified Tables
- `videos` - Added `show_type` column (ShowType enum, default 'HOME')
- `videos` - Removed `act_id` column (migrated to join table)

### Migration Notes
- Existing videos' `act_id` values migrated to `video_acts` table
- All existing videos default to `show_type = 'HOME'`

---

## Playwright Test Files

New/updated tests:
- `tests/e2e/v5-multi-act.spec.ts` - Multi-act API and UI tests
- `tests/e2e/v5-show-type.spec.ts` - Show type API and UI tests
- `tests/e2e/v5-ui.spec.ts` - UI overhaul and mobile responsiveness tests

Test categories to cover:
1. Multi-Act API (create, update, filter, rankings)
2. Multi-Act UI (submit form, edit form, display)
3. Show Type API (create, update, filter)
4. Show Type UI (submit form, badges, display)
5. Voting with multi-act (per-act voting)
6. UI Theme (colors, styling)
7. Mobile responsiveness (hamburger menu, layouts)

---

## Manual Test Checklist

Before each deploy, verify:

### Multi-Act Support
- [ ] Can select multiple acts when submitting video
- [ ] Video appears in browse when filtering by any of its acts
- [ ] Can edit video to change acts
- [ ] Title shows all acts separated by "/"
- [ ] Voting section shown for each act on detail page
- [ ] Can vote for same video in different act categories

### Show Type
- [ ] Show type dropdown on submit form (Home/Callaway)
- [ ] Default is "Home Show"
- [ ] Show type badge visible on video cards
- [ ] Show type badge on video detail page
- [ ] Can edit show type on existing videos
- [ ] Can filter videos by show type

### UI/Mobile
- [ ] FSU Garnet/Gold color scheme throughout
- [ ] Hamburger menu on mobile
- [ ] Menu opens and closes properly
- [ ] All pages usable on mobile viewport
- [ ] Forms are mobile-friendly
- [ ] Cards display properly on all screen sizes
