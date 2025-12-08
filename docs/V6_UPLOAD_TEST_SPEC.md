# V6 Video Upload System - Test Specification

## Overview

Test specification for the V6 Video Upload System feature. Covers upload flow, queue management, storage providers, and YouTube integration.

---

## Test Categories

1. Upload Page UI
2. Upload API
3. Queue Management API
4. Admin Queue Page
5. Storage Providers
6. YouTube Upload Integration
7. Daily Limit Tracking

---

## 1. Upload Page UI Tests

### 1.1 Authentication Required
```
GIVEN user is not logged in
WHEN navigating to /upload
THEN shows "Sign In Required" message
AND shows sign in button
```

### 1.2 Page Loads for Authenticated User
```
GIVEN user is logged in
WHEN navigating to /upload
THEN shows upload form
AND shows file drop zone
AND shows year dropdown (1990 to current)
AND shows show type dropdown (Home Show, Callaway Show)
AND shows act selection chips
AND shows performer search
AND shows description textarea
```

### 1.3 File Selection - Valid File
```
GIVEN user is on upload page
WHEN selecting a valid video file (MP4, MOV, etc.)
THEN shows file info (name, size)
AND shows remove button
AND enables submit button
```

### 1.4 File Selection - Invalid Type
```
GIVEN user is on upload page
WHEN selecting an invalid file type (e.g., .txt)
THEN shows error message "Invalid file type"
AND does not show file info
```

### 1.5 File Selection - Too Large
```
GIVEN user is on upload page
WHEN selecting a file over 2GB
THEN shows error message about file size
AND does not show file info
```

### 1.6 Form Validation - No File
```
GIVEN user is on upload page
WHEN submitting without selecting a file
THEN shows "Please select a video file" error
```

### 1.7 Form Validation - No Acts Selected
```
GIVEN user has selected a file
WHEN submitting without selecting any acts
THEN shows "Please select at least one act" error
```

### 1.8 Upload Progress Display
```
GIVEN user submits a valid upload
WHEN upload is in progress
THEN shows "Uploading to YouTube..." message
AND shows progress bar
AND shows "This may take a few minutes. Please don't close this page."
```

### 1.9 Upload Success (Local Dev)
```
GIVEN local dev environment
AND under daily upload limit
WHEN upload completes successfully
THEN shows "Video Live on YouTube!" with green checkmark
AND shows YouTube link
AND shows "Upload Another" button
```

### 1.10 Upload Queued (Production/At Limit)
```
GIVEN production environment OR at daily limit
WHEN upload completes
THEN shows "Video Queued!" with clock icon
AND shows appropriate queue message
AND shows "Upload Another" button
```

---

## 2. Upload API Tests

### 2.1 POST /api/upload - Success
```
GIVEN authenticated user
WHEN POST with valid file and metadata
THEN returns 201
AND returns queue item data
AND file is stored (local or Blob)
```

### 2.2 POST /api/upload - Not Authenticated
```
GIVEN no authentication
WHEN POST /api/upload
THEN returns 401 "Authentication required"
```

### 2.3 POST /api/upload - No File
```
GIVEN authenticated user
WHEN POST without file
THEN returns 400 "No file provided"
```

### 2.4 POST /api/upload - Invalid File Type
```
GIVEN authenticated user
WHEN POST with invalid file type
THEN returns 400 "Invalid file type"
```

### 2.5 POST /api/upload - File Too Large
```
GIVEN authenticated user
WHEN POST with file > 2GB
THEN returns 400 with file size error
```

### 2.6 POST /api/upload - No Title
```
GIVEN authenticated user
WHEN POST without title
THEN returns 400 "Title is required"
```

### 2.7 POST /api/upload - Invalid Year
```
GIVEN authenticated user
WHEN POST with year < 1950 or > next year
THEN returns 400 "Invalid year"
```

### 2.8 POST /api/upload - No Acts
```
GIVEN authenticated user
WHEN POST without actIds
THEN returns 400 "At least one act is required"
```

### 2.9 POST /api/upload - Invalid Act IDs
```
GIVEN authenticated user
WHEN POST with non-existent act IDs
THEN returns 400 "One or more invalid act IDs"
```

### 2.10 POST /api/upload - Storage Limit (Prod)
```
GIVEN production with Vercel Blob
AND pending storage > 900MB
WHEN POST new file
THEN returns 507 with storage limit message
AND mentions contacting Joey
```

---

## 3. Queue Management API Tests

### 3.1 GET /api/upload - List Own Uploads
```
GIVEN authenticated user
WHEN GET /api/upload
THEN returns only user's queue items
AND sorted by createdAt DESC
```

### 3.2 GET /api/upload - List All (Admin)
```
GIVEN authenticated user
WHEN GET /api/upload?all=true
THEN returns all users' queue items
```

### 3.3 GET /api/upload - Filter by Status
```
GIVEN queue items with various statuses
WHEN GET /api/upload?status=PENDING
THEN returns only PENDING items
```

### 3.4 GET /api/upload - Include Stats
```
GIVEN queue items exist
WHEN GET /api/upload?stats=true
THEN returns items and stats object
AND stats includes pending, uploaded, failed counts
AND stats includes todayUploads and dailyLimit
```

### 3.5 GET /api/upload - Not Authenticated
```
GIVEN no authentication
WHEN GET /api/upload
THEN returns 401
```

---

## 4. Admin Queue Page Tests

### 4.1 Page Loads
```
GIVEN authenticated user
WHEN navigating to /admin/queue
THEN shows stats cards
AND shows tab navigation (Pending/Uploaded/Failed)
AND shows queue items
```

### 4.2 Stats Cards Display
```
GIVEN queue with various items
WHEN viewing /admin/queue
THEN shows correct pending count
AND shows correct uploaded count
AND shows correct failed count
AND shows today's upload count with limit
```

### 4.3 Tab Navigation
```
GIVEN items in different states
WHEN clicking Pending tab
THEN shows only pending items
WHEN clicking Uploaded tab
THEN shows only uploaded items
WHEN clicking Failed tab
THEN shows only failed items
```

### 4.4 Queue Item Display
```
GIVEN queue item exists
WHEN viewing in list
THEN shows title
AND shows file name and size
AND shows year and show type
AND shows uploader name
AND shows timestamp in EST
```

### 4.5 Description Display
```
GIVEN queue item with description
WHEN viewing in list
THEN shows description in italics
```

### 4.6 Performer Count Display
```
GIVEN queue item with 3 performers
WHEN viewing in list
THEN shows "Performers tagged: 3"
```

### 4.7 Retry Button (Failed)
```
GIVEN failed queue item
WHEN clicking Retry button
THEN item status changes to PENDING
AND item appears in Pending tab
```

### 4.8 Mark Failed Button (Pending)
```
GIVEN pending queue item
WHEN clicking Failed button
THEN item status changes to FAILED
AND item appears in Failed tab
```

### 4.9 Empty State
```
GIVEN no items in selected tab
WHEN viewing that tab
THEN shows "No items" message
```

---

## 5. Storage Provider Tests

### 5.1 Local Storage - Upload
```
GIVEN STORAGE_PROVIDER not set (local)
WHEN uploading file
THEN file saved to LOCAL_STORAGE_PATH
AND URL returned as /api/files/...
```

### 5.2 Local Storage - Serve File
```
GIVEN file exists in local storage
WHEN GET /api/files/{path}
THEN returns file with correct content type
```

### 5.3 Local Storage - UNC Path Support
```
GIVEN LOCAL_STORAGE_PATH is UNC (\\server\share)
WHEN uploading file
THEN file saved correctly to network path
```

### 5.4 Vercel Blob - Upload
```
GIVEN STORAGE_PROVIDER=vercel-blob
AND BLOB_READ_WRITE_TOKEN set
WHEN uploading file
THEN file uploaded to Vercel Blob
AND URL is https://...blob.vercel-storage.com/...
```

### 5.5 getLocalFilePath - Standard Path
```
GIVEN standard LOCAL_STORAGE_PATH
WHEN calling getLocalFilePath
THEN returns correct joined path
```

### 5.6 getLocalFilePath - UNC Path
```
GIVEN UNC LOCAL_STORAGE_PATH
WHEN calling getLocalFilePath
THEN handles backslashes correctly
```

---

## 6. YouTube Upload Integration Tests

### 6.1 Upload Success
```
GIVEN local dev environment
AND valid video file in storage
WHEN uploadToYouTube called
THEN Python script executes
AND returns success with videoId and youtubeUrl
```

### 6.2 Upload - File Not Found
```
GIVEN non-existent file path
WHEN uploadToYouTube called
THEN returns error "File not found"
```

### 6.3 Upload - Script Not Found
```
GIVEN missing upload.py script
WHEN uploadToYouTube called
THEN returns error about script not found
```

### 6.4 Upload - Production Skip
```
GIVEN STORAGE_PROVIDER=vercel-blob
WHEN uploadToYouTube called
THEN returns error about not available in production
AND does not attempt upload
```

### 6.5 YouTube Metadata - Title
```
GIVEN video with act "Juggling" year 2019 show HOME
WHEN uploaded to YouTube
THEN title is "Juggling - FSU Flying High Circus Home Show 2019"
```

### 6.6 YouTube Metadata - Description with Performers
```
GIVEN video with performers ["John Doe", "Jane Smith"]
WHEN uploaded to YouTube
THEN description includes "Performers: John Doe, Jane Smith"
```

### 6.7 YouTube Metadata - Description with Notes
```
GIVEN video with description "Great performance!"
WHEN uploaded to YouTube
THEN description includes user notes
```

---

## 7. Daily Limit Tracking Tests

### 7.1 Under Limit - Immediate Upload
```
GIVEN 0 uploads today (limit 10)
WHEN submitting video in local dev
THEN immediately uploads to YouTube
AND increments daily count to 1
```

### 7.2 At Limit - Queue Only
```
GIVEN 10 uploads today (at limit)
WHEN submitting video
THEN does NOT upload to YouTube
AND returns "Daily upload limit reached" message
AND item stays as PENDING
```

### 7.3 Daily Count Persists
```
GIVEN upload at 11pm
WHEN checking count before midnight
THEN count reflects upload
WHEN checking after midnight
THEN new day, count is 0
```

### 7.4 Count Increment on Success
```
GIVEN upload succeeds to YouTube
WHEN checking daily count
THEN count incremented by 1
```

### 7.5 Count NOT Incremented on Failure
```
GIVEN YouTube upload fails
WHEN checking daily count
THEN count NOT incremented
```

---

## Test Data Requirements

### Users
- Regular user (for upload testing)
- Admin user (for queue management)

### Acts
- At least 3 acts in database
- Include: Juggling, Trapeze, Russian Bar

### Video Files
- Small valid MP4 (< 10MB for quick tests)
- Large valid MP4 (100MB+ for limit tests)
- Invalid file type (txt, jpg)

---

## Environment Configurations

### Local Dev Testing
```env
# No STORAGE_PROVIDER = local storage
LOCAL_STORAGE_PATH=./test-uploads
DATABASE_URL=postgresql://localhost/circus_test
```

### Production-like Testing
```env
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=test_token
DATABASE_URL=postgresql://localhost/circus_test
```

---

## Playwright Test Files

```
tests/e2e/v6-upload-ui.spec.ts       # Upload page UI tests
tests/e2e/v6-upload-api.spec.ts      # Upload API tests
tests/e2e/v6-queue-api.spec.ts       # Queue management API tests
tests/e2e/v6-admin-queue.spec.ts     # Admin queue page tests
```

---

## Manual Testing Checklist

### Happy Path - Local Dev
- [ ] Login as user
- [ ] Go to /upload
- [ ] Select video file
- [ ] Fill form (year, show type, act, performers, description)
- [ ] Submit
- [ ] See "Uploading to YouTube..." message
- [ ] Wait for completion
- [ ] See success with YouTube link
- [ ] Click YouTube link - video plays
- [ ] Video appears in /videos
- [ ] Check YouTube - metadata correct

### Happy Path - Production (Simulated)
- [ ] Set STORAGE_PROVIDER=vercel-blob
- [ ] Upload video
- [ ] See "Video Queued" message
- [ ] Check /admin/queue - item appears
- [ ] Run queue processor manually
- [ ] Item moves to Uploaded tab
- [ ] Video appears in /videos

### Error Cases
- [ ] Try upload without login - redirected
- [ ] Try invalid file type - error shown
- [ ] Try without selecting act - error shown
- [ ] Simulate storage full - error with Joey message
