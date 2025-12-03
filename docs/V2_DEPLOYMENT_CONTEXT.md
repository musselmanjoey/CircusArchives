# V2 Deployment Context - Circus Video Archive

## Overview
V2 adds authentication, video ownership, performer tagging, and video edit/delete functionality to the Circus Video Archive.

## Key Changes from V1

### 1. Authentication (NextAuth.js v5)
- **Provider**: Credentials-based with first/last name (no password)
- **Session**: JWT-based, stored in cookies (`authjs.*`)
- **Routes**: `/api/auth/*` handled by NextAuth
- **Environment Variables Required**:
  - `AUTH_SECRET` - Secret for JWT signing (generate with `openssl rand -base64 32`)
  - `AUTH_TRUST_HOST=true` - Required for production

### 2. Database Schema Changes
- **New `users` table**: Stores user accounts (id, firstName, lastName, email, createdAt)
- **New `video_performers` junction table**: Links videos to performer users
- **Videos table additions**:
  - `submittedById` - Foreign key to users (video owner)
  - Title is now auto-generated as `"{Act Name} {Year}"`

### 3. New API Endpoints
- `GET/POST /api/users` - User lookup and creation
- `PATCH /api/videos/[id]` - Update video (owner only)
- `DELETE /api/videos/[id]` - Delete video (owner only)
- `GET /api/videos?performerId=xxx` - Filter videos by performer

### 4. New/Modified Pages
- `/login` - Name-based login form
- `/videos/[id]/edit` - Video edit page (owner only)
- `/submit` - Now requires authentication, has performer selector
- `/videos/[id]` - Shows edit/delete buttons for owners, displays performers

### 5. Key Features
- **Performer Tagging**: Videos can have multiple performers tagged
- **Video Ownership**: Only submitter can edit/delete their videos
- **Auto-generated Titles**: No title field in form - generated from Act + Year

## Database Migration
Prisma migrations need to be run:
```bash
npx prisma migrate deploy
```

## Environment Variables Checklist
```
DATABASE_URL=postgresql://...
AUTH_SECRET=<generate-new-secret>
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://your-production-url.com  # Optional but recommended
```

## Build & Deploy Commands
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

## Test Coverage
- 93 E2E tests covering auth, video CRUD, performer tagging, and UI flows
- All tests pass on Chromium

## Breaking Changes
- Videos now require authentication to submit
- Video titles are auto-generated (old title field removed from form)
- API responses include `submittedBy` and `performers` fields
