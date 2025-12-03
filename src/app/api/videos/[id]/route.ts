import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, Video } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        act: true,
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Video>>({
      data: video as Video,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. Get video and verify it exists
    const video = await prisma.video.findUnique({
      where: { id },
      select: { id: true, uploaderId: true },
    });

    if (!video) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // 3. Check ownership (or admin role for future-proofing)
    const isOwner = video.uploaderId === session.user.id;
    const isAdmin = (session.user as { role?: string }).role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Not authorized to delete this video' },
        { status: 403 }
      );
    }

    // 4. Delete the video
    await prisma.video.delete({
      where: { id },
    });

    // 5. Return success response
    return NextResponse.json<ApiResponse<null>>(
      { message: 'Video deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
