/**
 * Upload Queue Processor
 *
 * Processes pending video uploads from the queue by:
 * 1. Checking daily YouTube upload limit (default: 10)
 * 2. Getting pending items from the queue
 * 3. Calling the Python upload script for each video
 * 4. Creating video entries in the database
 * 5. Updating queue status
 *
 * Run with: npx tsx scripts/process-upload-queue.ts
 * Or schedule via Windows Task Scheduler / cron
 */

import { PrismaClient, ShowType, UploadStatus } from '@prisma/client';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configuration
const DAILY_UPLOAD_LIMIT = parseInt(process.env.DAILY_UPLOAD_LIMIT || '10', 10);
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const UPLOAD_SCRIPT_PATH = path.join(__dirname, '..', 'tools', 'youtube', 'scripts', 'upload.py');

// For local dev, videos are stored here
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || 'Z:\\Share\\CircusArchives\\Imports';

interface UploadResult {
  success: boolean;
  videoId?: string;
  youtubeUrl?: string;
  error?: string;
}

/**
 * Get today's date at midnight UTC for consistent daily tracking
 */
function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * Get or create today's upload count record
 */
async function getDailyUploadCount(): Promise<number> {
  const today = getTodayDate();

  const record = await prisma.dailyUploadCount.findUnique({
    where: { date: today }
  });

  return record?.count || 0;
}

/**
 * Increment today's upload count
 */
async function incrementDailyUploadCount(): Promise<void> {
  const today = getTodayDate();

  await prisma.dailyUploadCount.upsert({
    where: { date: today },
    update: { count: { increment: 1 } },
    create: { date: today, count: 1 }
  });
}

/**
 * Get the local file path for a queue item
 */
function getLocalFilePath(blobUrl: string): string {
  // blobUrl format: /api/files/uploads/{userId}/{timestamp}-{filename}
  // Extract the path after /api/files/
  const relativePath = blobUrl.replace('/api/files/', '');
  return path.join(LOCAL_STORAGE_PATH, relativePath);
}

/**
 * Call the Python upload script
 */
async function uploadToYouTube(
  filePath: string,
  title: string,
  year: number,
  showType: ShowType,
  actNames: string[]
): Promise<UploadResult> {
  return new Promise((resolve) => {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      resolve({ success: false, error: `File not found: ${filePath}` });
      return;
    }

    // Build the title - use act names if available
    const actPart = actNames.length > 0 ? actNames.join(' & ') : 'Performance';
    const showPart = showType === 'CALLAWAY' ? 'Callaway' : 'Home Show';
    const fullTitle = `${actPart} - FSU Flying High Circus ${showPart} ${year}`;

    // Build arguments for the Python script
    const args = [
      UPLOAD_SCRIPT_PATH,
      filePath,
      fullTitle,
      '--year', year.toString(),
      '--show', showType === 'CALLAWAY' ? 'Callaway Gardens' : 'Home Show',
      '-p', 'unlisted'  // Start as unlisted, can change later
    ];

    // Add act if we have one
    if (actNames.length > 0) {
      args.push('--act', actNames[0]);
    }

    console.log(`\nUploading: ${title}`);
    console.log(`File: ${filePath}`);
    console.log(`Command: ${PYTHON_PATH} ${args.join(' ')}`);

    const process = spawn(PYTHON_PATH, args, {
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      console.log(text);
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      console.error(text);
    });

    process.on('close', (code) => {
      if (code === 0) {
        // Parse video ID from output
        // The script outputs: "Video ID: VIDEO_ID" and "URL: https://www.youtube.com/watch?v=VIDEO_ID"
        const videoIdMatch = stdout.match(/Video ID: ([a-zA-Z0-9_-]+)/);
        const urlMatch = stdout.match(/URL: (https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+)/);

        if (videoIdMatch && urlMatch) {
          resolve({
            success: true,
            videoId: videoIdMatch[1],
            youtubeUrl: urlMatch[1]
          });
        } else {
          resolve({
            success: false,
            error: 'Upload succeeded but could not parse video ID from output'
          });
        }
      } else {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`
        });
      }
    });

    process.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to start upload process: ${err.message}`
      });
    });
  });
}

/**
 * Create a video entry in the database after successful YouTube upload
 */
async function createVideoEntry(
  queueItem: {
    id: string;
    title: string;
    year: number;
    description: string | null;
    showType: ShowType;
    actIds: string[];
    performerIds: string[];
    uploaderId: string;
  },
  youtubeUrl: string,
  youtubeId: string
): Promise<void> {
  // Create the video
  const video = await prisma.video.create({
    data: {
      youtubeUrl,
      youtubeId,
      title: queueItem.title,
      year: queueItem.year,
      description: queueItem.description,
      showType: queueItem.showType,
      uploaderId: queueItem.uploaderId,
    }
  });

  // Create video-act relationships
  if (queueItem.actIds.length > 0) {
    await prisma.videoAct.createMany({
      data: queueItem.actIds.map(actId => ({
        videoId: video.id,
        actId
      }))
    });
  }

  // Create video-performer relationships
  if (queueItem.performerIds.length > 0) {
    await prisma.videoPerformer.createMany({
      data: queueItem.performerIds.map(userId => ({
        videoId: video.id,
        userId
      }))
    });
  }

  console.log(`Created video entry: ${video.id}`);
}

/**
 * Process the upload queue
 */
async function processQueue(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Upload Queue Processor');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Daily upload limit: ${DAILY_UPLOAD_LIMIT}`);

  // Check daily limit
  const currentCount = await getDailyUploadCount();
  const remainingUploads = DAILY_UPLOAD_LIMIT - currentCount;

  console.log(`Uploads today: ${currentCount}/${DAILY_UPLOAD_LIMIT}`);
  console.log(`Remaining slots: ${remainingUploads}`);

  if (remainingUploads <= 0) {
    console.log('\nDaily upload limit reached. Exiting.');
    return;
  }

  // Get pending items
  const pendingItems = await prisma.uploadQueue.findMany({
    where: { status: UploadStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: remainingUploads,
    include: {
      uploader: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  console.log(`\nPending items in queue: ${pendingItems.length}`);

  if (pendingItems.length === 0) {
    console.log('No items to process. Exiting.');
    return;
  }

  // Get act names for each item
  const actIds = [...new Set(pendingItems.flatMap(item => item.actIds))];
  const acts = await prisma.act.findMany({
    where: { id: { in: actIds } },
    select: { id: true, name: true }
  });
  const actNameMap = new Map(acts.map(a => [a.id, a.name]));

  // Process each item
  let successCount = 0;
  let failCount = 0;

  for (const item of pendingItems) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Processing: ${item.title}`);
    console.log(`Uploaded by: ${item.uploader.firstName} ${item.uploader.lastName}`);

    const filePath = getLocalFilePath(item.blobUrl);
    const actNames = item.actIds.map(id => actNameMap.get(id) || 'Unknown').filter(Boolean);

    const result = await uploadToYouTube(
      filePath,
      item.title,
      item.year,
      item.showType,
      actNames
    );

    if (result.success && result.youtubeUrl && result.videoId) {
      // Update queue item
      await prisma.uploadQueue.update({
        where: { id: item.id },
        data: {
          status: UploadStatus.UPLOADED,
          youtubeUrl: result.youtubeUrl,
          processedAt: new Date()
        }
      });

      // Create video entry
      await createVideoEntry(item, result.youtubeUrl, result.videoId);

      // Increment daily count
      await incrementDailyUploadCount();

      // Optionally delete the local file after successful upload
      // Uncomment if you want to clean up:
      // try { fs.unlinkSync(filePath); } catch {}

      successCount++;
      console.log(`SUCCESS: ${result.youtubeUrl}`);
    } else {
      // Update queue item with error
      await prisma.uploadQueue.update({
        where: { id: item.id },
        data: {
          status: UploadStatus.FAILED,
          errorMessage: result.error
        }
      });

      failCount++;
      console.log(`FAILED: ${result.error}`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Processed: ${pendingItems.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Completed at: ${new Date().toISOString()}`);
}

// Run the processor
processQueue()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
