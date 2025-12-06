import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, Video, ShowType } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        acts: {
          include: {
            act: true,
          },
        },
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

    // Add legacy `act` field for backward compat
    const videoWithAct = {
      ...video,
      act: video.acts[0]?.act || null,
    };

    return NextResponse.json<ApiResponse<Video>>({
      data: videoWithAct as Video,
    });
  } catch {
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
      select: { id: true, uploaderId: true, year: true },
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
    const { year, actIds, showType, description, performerIds } = body;

    // 4. Build update data
    const updateData: Record<string, unknown> = {};

    if (year !== undefined) {
      updateData.year = year;
    }

    if (showType !== undefined) {
      updateData.showType = showType as ShowType;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // 5. Handle act updates (V5: multiple acts)
    if (actIds !== undefined && Array.isArray(actIds) && actIds.length > 0) {
      // Verify acts exist
      const acts = await prisma.act.findMany({
        where: { id: { in: actIds } },
        select: { id: true, name: true },
      });

      if (acts.length !== actIds.length) {
        return NextResponse.json<ApiResponse<null>>(
          { error: 'One or more invalid act categories' },
          { status: 400 }
        );
      }

      // Delete existing act associations and create new ones
      await prisma.videoAct.deleteMany({
        where: { videoId: id },
      });

      await prisma.videoAct.createMany({
        data: actIds.map((actId: string) => ({
          videoId: id,
          actId,
        })),
      });

      // Update title
      const actNames = acts.map((a) => a.name).join(' / ');
      updateData.title = `${actNames} ${year ?? existingVideo.year}`;
    }

    // 6. Handle performer updates
    if (performerIds !== undefined) {
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

    // 7. Update video
    const video = await prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        acts: {
          include: {
            act: true,
          },
        },
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

    // Add legacy `act` field for backward compat
    const videoWithAct = {
      ...video,
      act: video.acts[0]?.act || null,
    };

    return NextResponse.json<ApiResponse<Video>>({
      data: videoWithAct as Video,
      message: 'Video updated successfully',
    });
  } catch {
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
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
