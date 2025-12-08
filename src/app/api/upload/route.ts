import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, getLocalFilePath } from '@/lib/storage';
import { uploadToYouTube } from '@/lib/youtube-upload';
import type { ApiResponse, UploadQueueItem, ShowType } from '@/types';

// Force Node.js runtime (not Edge) to allow child_process for YouTube upload
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB limit
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];

// Storage limit for pending uploads (Vercel Blob free tier = 1GB)
const MAX_PENDING_STORAGE = parseInt(process.env.MAX_PENDING_STORAGE_MB || '900', 10) * 1024 * 1024; // Default 900MB to leave buffer

// POST - Upload video file to Vercel Blob and create queue entry
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UploadQueueItem>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const year = formData.get('year') as string;
    const showType = formData.get('showType') as ShowType;
    const description = formData.get('description') as string | null;
    const actIds = formData.getAll('actIds') as string[];
    const performerIds = formData.getAll('performerIds') as string[];

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP4, MOV, AVI, WebM, MKV' },
        { status: 400 }
      );
    }

    // Validate metadata
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1950 || yearNum > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    if (!showType || !['HOME', 'CALLAWAY'].includes(showType)) {
      return NextResponse.json({ error: 'Show type is required (HOME or CALLAWAY)' }, { status: 400 });
    }

    if (!actIds || actIds.length === 0) {
      return NextResponse.json({ error: 'At least one act is required' }, { status: 400 });
    }

    // Verify acts exist
    const existingActs = await prisma.act.findMany({
      where: { id: { in: actIds } },
      select: { id: true },
    });

    if (existingActs.length !== actIds.length) {
      return NextResponse.json({ error: 'One or more invalid act IDs' }, { status: 400 });
    }

    // Check current pending storage usage (only in production with Vercel Blob)
    if (process.env.STORAGE_PROVIDER === 'vercel-blob') {
      const pendingStorage = await prisma.uploadQueue.aggregate({
        where: { status: 'PENDING' },
        _sum: { fileSize: true },
      });

      const currentUsage = pendingStorage._sum.fileSize || 0;
      const projectedUsage = currentUsage + file.size;

      if (projectedUsage > MAX_PENDING_STORAGE) {
        const currentMB = Math.round(currentUsage / 1024 / 1024);
        const limitMB = Math.round(MAX_PENDING_STORAGE / 1024 / 1024);
        return NextResponse.json(
          {
            error: `Storage limit reached! Currently ${currentMB}MB of ${limitMB}MB used. ` +
                   `Please try again tomorrow after pending videos are processed, ` +
                   `or contact Joey to upgrade the hosting plan.`
          },
          { status: 507 } // 507 Insufficient Storage
        );
      }
    }

    // Upload to storage (local or Vercel Blob based on config)
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${session.user.id}/${timestamp}-${sanitizedName}`;

    const result = await uploadFile(file, storagePath);

    // Create queue entry
    const queueItem = await prisma.uploadQueue.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        blobUrl: result.url,
        title: title.trim(),
        year: yearNum,
        description: description?.trim() || null,
        showType,
        actIds,
        performerIds: performerIds || [],
        uploaderId: session.user.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Check if we can upload immediately (local dev only, under daily limit)
    // Skip auto-upload if SKIP_YOUTUBE_UPLOAD is set (test mode - items stay in queue)
    const skipAutoUpload = process.env.SKIP_YOUTUBE_UPLOAD === 'true';
    const isLocalDev = process.env.STORAGE_PROVIDER !== 'vercel-blob';
    const today = getTodayDate();
    const todayRecord = await prisma.dailyUploadCount.findUnique({
      where: { date: today }
    });
    const todayCount = todayRecord?.count || 0;
    const canUploadNow = isLocalDev && !skipAutoUpload && todayCount < DAILY_UPLOAD_LIMIT;

    if (canUploadNow) {
      // Get act names for the YouTube title
      const acts = await prisma.act.findMany({
        where: { id: { in: actIds } },
        select: { name: true }
      });
      const actNames = acts.map(a => a.name);

      // Get performer names for YouTube metadata
      let performerNames: string[] = [];
      if (performerIds && performerIds.length > 0) {
        const performers = await prisma.user.findMany({
          where: { id: { in: performerIds } },
          select: { firstName: true, lastName: true }
        });
        performerNames = performers.map(p => `${p.firstName} ${p.lastName}`);
      }

      // Get local file path
      const localPath = getLocalFilePath(result.url);

      console.log(`[Upload API] Attempting immediate YouTube upload...`);
      console.log(`[Upload API] File path: ${localPath}`);
      console.log(`[Upload API] Performers: ${performerNames.join(', ') || 'none'}`);

      const uploadResult = await uploadToYouTube(
        localPath,
        title.trim(),
        yearNum,
        showType,
        actNames,
        description?.trim(),
        performerNames
      );

      if (uploadResult.success && uploadResult.youtubeUrl && uploadResult.videoId) {
        // Update queue item as uploaded
        await prisma.uploadQueue.update({
          where: { id: queueItem.id },
          data: {
            status: 'UPLOADED',
            youtubeUrl: uploadResult.youtubeUrl,
            processedAt: new Date()
          }
        });

        // Create video entry in main database
        const video = await prisma.video.create({
          data: {
            youtubeUrl: uploadResult.youtubeUrl,
            youtubeId: uploadResult.videoId,
            title: title.trim(),
            year: yearNum,
            description: description?.trim() || null,
            showType,
            uploaderId: session.user.id,
          }
        });

        // Create video-act relationships
        if (actIds.length > 0) {
          await prisma.videoAct.createMany({
            data: actIds.map(actId => ({
              videoId: video.id,
              actId
            }))
          });
        }

        // Create video-performer relationships
        if (performerIds && performerIds.length > 0) {
          await prisma.videoPerformer.createMany({
            data: performerIds.map(userId => ({
              videoId: video.id,
              userId
            }))
          });
        }

        // Increment daily upload count
        await prisma.dailyUploadCount.upsert({
          where: { date: today },
          update: { count: { increment: 1 } },
          create: { date: today, count: 1 }
        });

        return NextResponse.json({
          data: {
            ...queueItem,
            status: 'UPLOADED',
            youtubeUrl: uploadResult.youtubeUrl
          } as unknown as UploadQueueItem,
          message: `Video uploaded successfully! Watch at: ${uploadResult.youtubeUrl}`,
          uploadedImmediately: true
        }, { status: 201 });
      } else {
        // Upload failed - leave as pending, return the error
        console.error(`[Upload API] YouTube upload failed: ${uploadResult.error}`);
        return NextResponse.json({
          data: queueItem as unknown as UploadQueueItem,
          message: `Video saved but YouTube upload failed: ${uploadResult.error}. Video has been queued for retry.`,
          uploadedImmediately: false
        }, { status: 201 });
      }
    }

    // Either in prod or at daily limit - just queue it
    const remainingSlots = DAILY_UPLOAD_LIMIT - todayCount;
    const queueMessage = remainingSlots <= 0
      ? `Daily upload limit reached (${DAILY_UPLOAD_LIMIT}/day). Video has been queued and will be uploaded tomorrow.`
      : `Video queued for upload. It will be processed shortly.`;

    return NextResponse.json({
      data: queueItem as unknown as UploadQueueItem,
      message: queueMessage,
      uploadedImmediately: false,
      dailyUploadsRemaining: Math.max(0, remainingSlots)
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

const DAILY_UPLOAD_LIMIT = parseInt(process.env.DAILY_UPLOAD_LIMIT || '10', 10);

/**
 * Get today's date at midnight UTC for consistent daily tracking
 */
function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// GET - List queue items (for admin view)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const all = searchParams.get('all') === 'true'; // Admin flag to see all uploads
    const includeStats = searchParams.get('stats') === 'true';

    const where: { status?: 'PENDING' | 'UPLOADED' | 'FAILED'; uploaderId?: string } = {};

    if (status && ['PENDING', 'UPLOADED', 'FAILED'].includes(status)) {
      where.status = status as 'PENDING' | 'UPLOADED' | 'FAILED';
    }

    // Regular users only see their own uploads
    if (!all) {
      where.uploaderId = session.user.id;
    }

    const queueItems = await prisma.uploadQueue.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If stats are requested, gather them
    if (includeStats) {
      const today = getTodayDate();

      const [pendingCount, uploadedCount, failedCount, todayUploads] = await Promise.all([
        prisma.uploadQueue.count({ where: { status: 'PENDING' } }),
        prisma.uploadQueue.count({ where: { status: 'UPLOADED' } }),
        prisma.uploadQueue.count({ where: { status: 'FAILED' } }),
        prisma.dailyUploadCount.findUnique({ where: { date: today } }),
      ]);

      return NextResponse.json({
        data: {
          items: queueItems as unknown as UploadQueueItem[],
          stats: {
            pending: pendingCount,
            uploaded: uploadedCount,
            failed: failedCount,
            todayUploads: todayUploads?.count || 0,
            dailyLimit: DAILY_UPLOAD_LIMIT,
          },
        },
      });
    }

    return NextResponse.json({ data: queueItems as unknown as UploadQueueItem[] });
  } catch (error) {
    console.error('Queue fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}
