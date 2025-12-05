# V3 Voting System Test Specification

This document outlines all features implemented in V3 that need testing before each deploy.

## V3 Features Overview

- One "Best" vote per user per act category
- Vote switching (change vote to different video in same act)
- Performer bonus (2x vote weight if voter is tagged as performer)
- Rankings page showing top-voted videos by act
- Voters list modal (Instagram-style "who voted" view)

---

## V3 Features (Voting API)

### POST /api/votes - Cast/Update Vote
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires authentication | POST without session | Returns 401 "Authentication required" |
| Cast vote on video | POST with `{ videoId }` | Returns 201, creates vote |
| Switch vote in same act | POST vote for different video in same act | Returns 200, updates existing vote |
| Vote for different acts | POST votes for videos in different acts | Returns 201 for each (allowed) |
| Reject non-existent video | POST with invalid videoId | Returns 404 "Video not found" |
| Reject missing videoId | POST with empty body | Returns 400 "Video ID is required" |

### GET /api/votes/me - Get User's Votes
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires authentication | GET without session | Returns 401 "Authentication required" |
| Returns user votes | GET with valid session | Returns array of votes with video/act details |
| Empty when no votes | GET (user has no votes) | Returns empty array |

### DELETE /api/votes/[actId] - Remove Vote
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Requires authentication | DELETE without session | Returns 401 "Authentication required" |
| Remove existing vote | DELETE with valid actId | Returns 200 "Vote removed" |
| Vote not found | DELETE with actId user hasn't voted for | Returns 404 "Vote not found" |

---

## V3 Features (Rankings API)

### GET /api/rankings - Get Rankings
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Returns all acts | GET without params | Returns array of ActRanking for each act |
| Filter by act | GET `?actId=[id]` | Returns VideoRanking array for that act |
| Includes top video | GET (acts with votes) | Each ActRanking has `topVideo` populated |
| No votes = null topVideo | GET (acts without votes) | `topVideo` is null, `totalVotes` is 0 |
| Performer bonus calculated | Performer votes for their video | Vote counts as 2 in `totalVotes` |

### Performer Bonus Logic
| Scenario | Expected Vote Weight |
|----------|---------------------|
| Regular user votes | 1 |
| User tagged as performer on the video votes | 2 |

---

## V3 Features (Voters List API)

### GET /api/videos/[id]/voters - Get Voters for Video
| Test | Input | Expected Behavior |
|------|-------|-------------------|
| Returns voters list | GET with valid video id | Returns array of VoteWithDetails |
| Includes user info | GET | Each vote has `user` with firstName/lastName |
| Shows performer status | Voter is performer on video | `isPerformer: true`, `voteWeight: 2` |
| Non-performer voter | Voter is not performer | `isPerformer: false`, `voteWeight: 1` |
| Empty for no votes | Video has no votes | Returns empty array |
| 404 for invalid video | GET with invalid id | Returns 404 "Video not found" |

---

## V3 Features (Voting UI)

### Video Detail Page Vote Button
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Vote button visible | `/videos/[id]` (logged in) | Shows "Vote Best [Act Name]" button |
| Button hidden if not logged in | `/videos/[id]` (not logged in) | Vote button not shown |
| Click to vote | Click vote button | Changes to "Your Best [Act Name]" (green) |
| Shows vote count | Video has votes | Displays "[N] votes" link |
| Remove vote option | After voting | Shows "Remove vote" link below button |
| Different video voted | User voted for different video in act | Shows "You voted for a different [Act] video" |
| Switch vote | Click vote on different video in same act | Updates vote, button becomes green |

### Voters Modal
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Click to open | Click "[N] votes" link | Opens modal with voters list |
| Shows voter names | Modal open | Lists all voters with first/last name |
| Performer indicator | Voter is performer | Shows "Performer (2x vote)" badge |
| Close modal | Click X or backdrop | Closes modal |

---

## V3 Features (Homepage Rankings)

### Rankings Page Layout
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Page loads | `/` | Shows "Best Circus Performances" heading |
| Acts with votes shown | Acts have votes | Shows "Top Voted Performances" section |
| Acts without votes | Acts have no votes | Shows in "More Acts" / "All Acts" section |
| Video thumbnail | Act has top video | Shows YouTube thumbnail |
| Year badge | Act has top video | Shows year in bottom-right corner |
| "#1 Best" badge | Featured cards | Shows gold badge in top-left |
| Vote count | Act has votes | Shows "[N] votes" on card |
| Performers shown | Video has performers | Shows up to 3 performer names |
| Truncated performers | Video has 4+ performers | Shows "Name1, Name2, Name3 +N more" |
| No performers | Video has no performers | No performer text shown |
| Click navigates | Click on video card | Navigates to `/videos/[id]` |
| Acts without votes | Act has no votes | Shows placeholder with "No votes yet" |
| Click act without votes | Click placeholder card | Navigates to `/videos?actId=[id]` |

---

## V3 Features (Navigation)

### Navigation Links
| Test | Path | Expected Behavior |
|------|------|-------------------|
| Nav order correct | Any page | Shows "Best Videos" → "Browse" → "Submit Video" |
| Best Videos link | Click "Best Videos" | Navigates to `/` |
| Best Videos active state | On `/` | "Best Videos" link is highlighted |
| Browse link | Click "Browse" | Navigates to `/videos` |
| Submit Video link | Click "Submit Video" | Navigates to `/submit` |

---

## Database Schema (V3)

### New Tables
- `votes` - id, user_id, video_id, act_id, timestamps
  - Unique constraint on `[user_id, act_id]` (one vote per user per act)

### Relations
- `votes.user_id` → `users.id` (cascade delete)
- `votes.video_id` → `videos.id` (cascade delete)
- `votes.act_id` → `acts.id` (cascade delete)

---

## Playwright Test Files

New tests needed:
- `tests/e2e/voting.spec.ts` - Voting API and UI tests (stub exists)

Test categories to cover:
1. Voting API (auth, cast, switch, remove)
2. Rankings API (all acts, single act, performer bonus)
3. Voters List API (list voters, performer indicator)
4. Voting UI (button states, vote count, modal)
5. Rankings Page (layout, cards, performers)
6. Navigation (link order, active states)

---

## Manual Test Checklist

Before each deploy, verify:

### Voting Flow
- [ ] Can vote for a video when logged in
- [ ] Vote button changes state after voting
- [ ] Can remove vote
- [ ] Can switch vote to different video in same act
- [ ] Cannot vote for multiple videos in same act
- [ ] Can vote for videos in different acts

### Rankings Page
- [ ] Homepage shows rankings by act
- [ ] Voted acts show top video with thumbnail
- [ ] Acts without votes show placeholder
- [ ] Performer names shown on cards
- [ ] Long performer lists truncated
- [ ] Clicking card navigates to video

### Voters List
- [ ] Vote count displayed on video page
- [ ] Clicking vote count opens modal
- [ ] Modal shows all voters
- [ ] Performers marked with 2x badge
- [ ] Modal closes properly

### Performer Bonus
- [ ] Performer vote counts as 2 in rankings
- [ ] Performer vote shows 2x in voters list
- [ ] Non-performer vote counts as 1

### Navigation
- [ ] "Best Videos" link visible and works
- [ ] Nav order: Best Videos → Browse → Submit Video
