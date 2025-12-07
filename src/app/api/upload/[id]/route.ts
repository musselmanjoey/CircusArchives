import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/storage';
import { extractYouTubeId, isValidYouTubeUrl } from '@/lib/youtube';
import type { ApiResponse, UploadQueueItem, Video } from '@/types';

type RouteContext = { params: Promise<{ id: string }> };

// GET - Get single queue item
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<UploadQueueItem>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await context.params;

    const queueItem = await prisma.uploadQueue.findUnique({
      where: { id },
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

    if (!queueItem) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    return NextResponse.json({ data: queueItem as unknown as UploadQueueItem });
  } catch (error) {
    console.error('Queue item fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue item' }, { status: 500 });
  }
}

// PATCH - Update queue item (mark as uploaded, failed, etc.)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<UploadQueueItem | Video>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, youtubeUrl, errorMessage } = body;

    const queueItem = await prisma.uploadQueue.findUnique({
      where: { id },
    });

    if (!queueItem) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    // If marking as UPLOADED with a YouTube URL, create the video entry
    if (status === 'UPLOADED' && youtubeUrl) {
      if (!isValidYouTubeUrl(youtubeUrl)) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
      }

      const youtubeId = extractYouTubeId(youtubeUrl);
      if (!youtubeId) {
        return NextResponse.json({ error: 'Could not extract YouTube ID' }, { status: 400 });
      }

      // Check for duplicate
      const existingVideo = await prisma.video.findFirst({
        where: { youtubeId },
      });

      if (existingVideo) {
        return NextResponse.json({ error: 'A video with this YouTube URL already exists' }, { status: 409 });
      }

      // Create video and update queue in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the video
        const video = await tx.video.create({
          data: {
            youtubeUrl,
            youtubeId,
            title: queueItem.title,
            year: queueItem.year,
            description: queueItem.description,
            showType: queueItem.showType,
            uploaderId: queueItem.uploaderId,
            acts: {
              create: queueItem.actIds.map((actId) => ({ actId })),
            },
            performers: queueItem.performerIds.length > 0
              ? { create: queueItem.performerIds.map((userId) => ({ userId })) }
              : undefined,
          },
          include: {
            acts: { include: { act: true } },
            performers: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
            uploader: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        });

        // Update queue item
        await tx.uploadQueue.update({
          where: { id },
          data: {
            status: 'UPLOADED',
            youtubeUrl,
            processedAt: new Date(),
          },
        });

        // Delete file from storage to free up space
        try {
          await deleteFile(queueItem.blobUrl);
        } catch (storageError) {
          console.error('Failed to delete file:', storageError);
          // Don't fail the transaction, cleanup can happen later
        }

        return video;
      });

      return NextResponse.json({
        data: result as unknown as Video,
        message: 'Video created successfully',
      });
    }

    // Just update status (for FAILED or other status updates)
    const updated = await prisma.uploadQueue.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(errorMessage !== undefined && { errorMessage }),
        ...(status === 'UPLOADED' && { processedAt: new Date() }),
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

    return NextResponse.json({ data: updated as unknown as UploadQueueItem });
  } catch (error) {
    console.error('Queue update error:', error);
    return NextResponse.json({ error: 'Failed to update queue item' }, { status: 500 });
  }
}

// DELETE - Remove queue item and blob
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await context.params;

    const queueItem = await prisma.uploadQueue.findUnique({
      where: { id },
    });

    if (!queueItem) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    // Delete file from storage first
    try {
      await deleteFile(queueItem.blobUrl);
    } catch (storageError) {
      console.error('Failed to delete file:', storageError);
      // Continue with DB deletion anyway
    }

    // Delete queue entry
    await prisma.uploadQueue.delete({
      where: { id },
    });

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error('Queue delete error:', error);
    return NextResponse.json({ error: 'Failed to delete queue item' }, { status: 500 });
  }
}
