# V6 Deployment Summary

This document summarizes all V6 changes that need to be deployed.

## Overview

V6 introduces a **Video Upload System** allowing users to upload video files directly from their devices. Videos are queued for YouTube upload, with automatic upload when under daily limits (local dev) or manual processing via queue processor (production).

---

## Database Migrations

New migration required for V6 tables:

**Run on production:**
```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

**New Enum:**
- `UploadStatus` - ENUM ('PENDING', 'UPLOADED', 'FAILED')

**New Tables:**

### `upload_queue`
Stores uploaded video files awaiting YouTube upload.
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| file_name | TEXT | Original filename |
| file_size | INT | File size in bytes |
| blob_url | TEXT | URL to stored file (local path or Vercel Blob) |
| title | TEXT | Video title |
| year | INT | Performance year |
| description | TEXT? | Optional description |
| show_type | ShowType | HOME or CALLAWAY |
| act_ids | TEXT[] | Array of act IDs |
| performer_ids | TEXT[] | Array of performer user IDs |
| status | UploadStatus | PENDING, UPLOADED, or FAILED |
| youtube_url | TEXT? | Filled after successful upload |
| error_message | TEXT? | Error details if failed |
| uploader_id | TEXT | FK to users (CASCADE delete) |
| created_at | TIMESTAMP | Queue entry creation time |
| updated_at | TIMESTAMP | Last update time |
| processed_at | TIMESTAMP? | When uploaded to YouTube |

### `daily_upload_counts`
Tracks daily YouTube uploads for rate limiting.
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| date | DATE | Unique date (one record per day) |
| count | INT | Number of uploads that day |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

---

## Environment Variables

### Required for Production

```bash
# Vercel Blob Storage
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=<your-vercel-blob-token>

# Optional: Override defaults
MAX_PENDING_STORAGE_MB=900    # Default 900MB (Vercel free tier buffer)
DAILY_UPLOAD_LIMIT=10         # Default 10 uploads/day
```

### Local Development

```bash
# Uses local file storage by default
LOCAL_STORAGE_PATH=Z:\Share\CircusArchives\Imports
LOCAL_STORAGE_URL=/api/files
# STORAGE_PROVIDER not set = local storage
```

---

## New Features

### Video File Upload
- Direct video upload from device (mobile or desktop)
- Drag & drop or tap to select file
- Supported formats: MP4, MOV, AVI, WebM, MKV
- Max file size: 2GB
- Progress indicator during upload

### Upload Queue System
- Files stored temporarily (Vercel Blob in prod, local in dev)
- Queue entry created with video metadata
- Admin queue page to view/manage uploads
- Retry button for failed uploads
- Mark as failed option

### Automatic YouTube Upload (Local Dev Only)
- Checks daily upload limit (default: 10/day)
- If under limit, immediately uploads to YouTube
- Creates video entry in database
- Increments daily upload count
- Shows YouTube link on success

### Queue-Based Upload (Production)
- Files uploaded to Vercel Blob storage
- User sees "Video Queued" message
- Admin processes queue manually or via scheduled job
- Queue processor script downloads from Blob and uploads to YouTube

### YouTube Metadata
- Auto-generated title: "[Act] - FSU Flying High Circus [Show] [Year]"
- Description includes performers and user notes
- Standard circus tags for discoverability
- Machine-readable metadata block for future automation

### Admin Queue Page (`/admin/queue`)
- Stats cards: Pending, Uploaded, Failed, Today's uploads
- Tab navigation: Pending | Uploaded | Failed
- EST timestamps on all entries
- Description and performer count display
- Retry and Mark Failed buttons

### Storage Abstraction
- Pluggable storage providers (local vs Vercel Blob)
- Local: Saves to configurable path (network drive supported)
- Vercel Blob: Cloud storage with 1GB free tier
- Storage limit checking with friendly error messages

---

## New Files

```
src/app/upload/page.tsx                    # Upload page with file upload form
src/app/admin/queue/page.tsx               # Admin queue management page
src/app/api/upload/route.ts                # Upload API (POST, GET with stats)
src/app/api/files/[...path]/route.ts       # File serving for local storage
src/components/video/VideoUploadForm.tsx   # Video upload form component
src/lib/storage/index.ts                   # Storage abstraction layer
src/lib/storage/local.ts                   # Local file storage provider
src/lib/storage/vercel-blob.ts             # Vercel Blob storage provider
src/lib/youtube-upload.ts                  # YouTube upload helper (Node.js)
scripts/process-upload-queue.ts            # Queue processor script
docs/V6_DEPLOYMENT_SUMMARY.md              # This file
```

---

## Modified Files

```
prisma/schema.prisma                       # UploadQueue, DailyUploadCount, UploadStatus
src/types/index.ts                         # UploadQueueItem, UploadStatus types
src/lib/utils.ts                           # formatDateTime (EST timezone)
tools/youtube/scripts/upload.py            # Added --performers and --notes args
```

---

## API Changes

### POST /api/upload
Upload a video file and create queue entry.

**Request:** `multipart/form-data`
- `file` (File) - Video file
- `title` (string) - Video title
- `year` (string) - Performance year
- `showType` (string) - "HOME" or "CALLAWAY"
- `description` (string?) - Optional description
- `actIds` (string[]) - Act IDs (at least one required)
- `performerIds` (string[]?) - Performer user IDs

**Response:**
```json
{
  "data": { /* UploadQueueItem */ },
  "message": "Video uploaded successfully! Watch at: https://...",
  "uploadedImmediately": true,
  "dailyUploadsRemaining": 9
}
```

### GET /api/upload
List queue items.

**Query params:**
- `status` - Filter by PENDING, UPLOADED, or FAILED
- `all=true` - Show all users' uploads (admin)
- `stats=true` - Include stats object

**Response with stats:**
```json
{
  "data": {
    "items": [ /* UploadQueueItem[] */ ],
    "stats": {
      "pending": 5,
      "uploaded": 10,
      "failed": 2,
      "todayUploads": 3,
      "dailyLimit": 10
    }
  }
}
```

---

## Production Deployment Steps

1. **Deploy code to Vercel**
   ```bash
   git add -A
   git commit -m "feat: V6 Video Upload System"
   git push
   ```

2. **Run database migrations**
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   ```

3. **Set environment variables in Vercel**
   - `STORAGE_PROVIDER=vercel-blob`
   - `BLOB_READ_WRITE_TOKEN=<token>` (from Vercel Storage dashboard)

4. **Test upload flow**
   - Upload a small video
   - Verify it appears in queue
   - Verify file is in Vercel Blob storage

5. **Process queue manually (when ready)**
   ```bash
   # From local machine with YouTube OAuth configured
   DATABASE_URL="<prod-url>" npm run queue:process
   ```

---

## Post-Deployment Verification

### Upload Flow
- [ ] Can access /upload page when logged in
- [ ] Shows "Sign In Required" when not logged in
- [ ] Can select video file (drag & drop and click)
- [ ] Shows file info after selection
- [ ] Can fill in year, show type, acts, performers, description
- [ ] Submit shows "Uploading to YouTube..." message
- [ ] Success shows appropriate message

### Queue Management
- [ ] Can access /admin/queue page
- [ ] Stats cards show correct counts
- [ ] Tab navigation works (Pending/Uploaded/Failed)
- [ ] Queue items show correct info
- [ ] Timestamps display in EST
- [ ] Retry button works on failed items
- [ ] Mark Failed button works on pending items

### Storage (Production)
- [ ] File uploads to Vercel Blob successfully
- [ ] Storage limit check works (900MB default)
- [ ] Friendly error when storage full

### YouTube Metadata (After Processing)
- [ ] Video title formatted correctly
- [ ] Description includes performers
- [ ] Description includes user notes
- [ ] Tags present on video

---

## Queue Processor Usage

For manual processing of queued videos:

```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Run processor
npm run queue:process
```

The processor will:
1. Check daily upload limit
2. Get pending items from queue
3. For each item:
   - Download file (if Vercel Blob)
   - Upload to YouTube with metadata
   - Create video entry in database
   - Update queue status
   - Increment daily count

---

## Storage Limits

### Vercel Blob (Free Tier)
- 1GB total storage
- Using 900MB threshold to leave buffer
- Files deleted after successful YouTube upload (configurable)

### YouTube Daily Limit
- Default: 10 uploads per day
- Configurable via `DAILY_UPLOAD_LIMIT` env var
- Resets at midnight UTC

---

## Future Enhancements (V7+)

- [ ] GitHub Actions for scheduled queue processing
- [ ] Email notification when video goes live
- [ ] OAuth authentication (replace name-based login)
- [ ] Bulk upload from admin panel
- [ ] Upload progress via WebSocket/SSE
- [ ] Automatic retry for failed uploads

---

## Rollback Plan

If issues occur:

1. **Database:** Tables are additive, can be dropped:
   ```sql
   DROP TABLE IF EXISTS upload_queue;
   DROP TABLE IF EXISTS daily_upload_counts;
   DROP TYPE IF EXISTS "UploadStatus";
   ```

2. **Code:** Revert to V5 commit
   ```bash
   git revert HEAD
   git push
   ```

3. **Storage:** Vercel Blob files persist independently, can be cleaned up via dashboard

---

## Known Issues

- YouTube upload only works locally (Vercel serverless timeout limitation)
- Large files may timeout during upload to Vercel Blob
- No real-time progress for YouTube upload portion (shows at end)
