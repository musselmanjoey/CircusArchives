import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, VideoPerformer } from '@/types';

/**
 * POST /api/videos/[id]/performers
 * Add performers to a video - any logged-in user can do this
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { performerIds } = body as { performerIds: string[] };

    if (!performerIds || !Array.isArray(performerIds)) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'performerIds array is required' },
        { status: 400 }
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!video) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Get current performers
    const existingPerformers = await prisma.videoPerformer.findMany({
      where: { videoId: id },
      select: { userId: true },
    });
    const existingIds = new Set(existingPerformers.map((p) => p.userId));

    // Only add new performers (don't remove existing ones)
    const newPerformerIds = performerIds.filter((pid) => !existingIds.has(pid));

    if (newPerformerIds.length > 0) {
      await prisma.videoPerformer.createMany({
        data: newPerformerIds.map((userId) => ({
          videoId: id,
          userId,
          taggedById: session.user.id, // Track who added this tag
        })),
        skipDuplicates: true,
      });
    }

    // Fetch updated performers list
    const updatedPerformers = await prisma.videoPerformer.findMany({
      where: { videoId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<VideoPerformer[]>>({
      data: updatedPerformers as VideoPerformer[],
      message: `Added ${newPerformerIds.length} performer(s)`,
    });
  } catch (error) {
    console.error('Failed to add performers:', error);
    const message = error instanceof Error ? error.message : 'Failed to add performers';
    return NextResponse.json<ApiResponse<null>>(
      { error: message },
      { status: 500 }
    );
  }
}
