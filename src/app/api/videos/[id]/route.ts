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
        performers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
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

export async function PATCH(
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

    // 2. Get video and verify ownership
    const existingVideo = await prisma.video.findUnique({
      where: { id },
      select: { id: true, uploaderId: true },
    });

    if (!existingVideo) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const isOwner = existingVideo.uploaderId === session.user.id;
    const isAdmin = (session.user as { role?: string }).role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Not authorized to edit this video' },
        { status: 403 }
      );
    }

    // 3. Parse update data
    const body = await request.json();
    const { year, actId, description, performerIds } = body;

    // 4. Build update data
    const updateData: Record<string, unknown> = {};

    if (year !== undefined) {
      updateData.year = year;
    }

    if (actId !== undefined) {
      // Verify act exists and get name for title
      const act = await prisma.act.findUnique({
        where: { id: actId },
        select: { name: true },
      });
      if (!act) {
        return NextResponse.json<ApiResponse<null>>(
          { error: 'Invalid act category' },
          { status: 400 }
        );
      }
      updateData.actId = actId;
      // Update title to match new act + year
      updateData.title = `${act.name} ${year ?? (await prisma.video.findUnique({ where: { id }, select: { year: true } }))?.year}`;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // 5. Handle performer updates
    if (performerIds !== undefined) {
      // Delete existing performers and add new ones
      await prisma.videoPerformer.deleteMany({
        where: { videoId: id },
      });

      if (performerIds.length > 0) {
        await prisma.videoPerformer.createMany({
          data: performerIds.map((userId: string) => ({
            videoId: id,
            userId,
          })),
        });
      }
    }

    // 6. Update video
    const video = await prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        act: true,
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        performers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<Video>>({
      data: video as Video,
      message: 'Video updated successfully',
    });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to update video' },
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
