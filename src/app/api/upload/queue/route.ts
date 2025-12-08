import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { ApiResponse, UploadQueueItem, ShowType } from '@/types';

/**
 * Create a queue entry after client-side blob upload completes.
 * This endpoint receives the blob URL and metadata, NOT the file itself.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UploadQueueItem>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      blobUrl,
      fileName,
      fileSize,
      title,
      year,
      showType,
      description,
      actIds,
      performerIds,
    } = body as {
      blobUrl: string;
      fileName: string;
      fileSize: number;
      title: string;
      year: number;
      showType: ShowType;
      description?: string;
      actIds: string[];
      performerIds?: string[];
    };

    // Validate required fields
    if (!blobUrl) {
      return NextResponse.json({ error: 'Blob URL is required' }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const yearNum = typeof year === 'number' ? year : parseInt(year, 10);
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

    // Create queue entry
    const queueItem = await prisma.uploadQueue.create({
      data: {
        fileName,
        fileSize: fileSize || 0,
        blobUrl,
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

    return NextResponse.json({
      data: queueItem as unknown as UploadQueueItem,
      message: 'Video queued for processing. It will be uploaded to YouTube shortly.',
    }, { status: 201 });
  } catch (error) {
    console.error('Queue creation error:', error);
    return NextResponse.json({ error: 'Failed to create queue entry' }, { status: 500 });
  }
}
