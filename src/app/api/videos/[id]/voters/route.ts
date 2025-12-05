import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse, VoteWithDetails } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/videos/:id/voters - Get list of voters for a video
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: videoId } = await params;

    // Get the video with its performers
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        performers: { select: { userId: true } },
      },
    });

    if (!video) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const performerUserIds = new Set(video.performers.map((p) => p.userId));

    // Get all votes for this video
    const votes = await prisma.vote.findMany({
      where: { videoId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add performer info to each vote
    const votersWithDetails: VoteWithDetails[] = votes.map((vote) => {
      const isPerformer = performerUserIds.has(vote.userId);
      return {
        id: vote.id,
        userId: vote.userId,
        user: vote.user,
        videoId: vote.videoId,
        actId: vote.actId,
        createdAt: vote.createdAt,
        updatedAt: vote.updatedAt,
        isPerformer,
        voteWeight: isPerformer ? 2 : 1,
      };
    });

    return NextResponse.json<ApiResponse<VoteWithDetails[]>>({
      data: votersWithDetails,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch voters' },
      { status: 500 }
    );
  }
}
