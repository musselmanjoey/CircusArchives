import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, Vote } from '@/types';

// POST /api/votes - Cast or update a vote
// V5: Now requires actId since videos can have multiple acts
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoId, actId } = body;

    if (!videoId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    if (!actId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Act ID is required' },
        { status: 400 }
      );
    }

    // Verify the video exists and has the specified act
    const videoAct = await prisma.videoAct.findUnique({
      where: {
        videoId_actId: {
          videoId,
          actId,
        },
      },
      include: {
        video: true,
        act: true,
      },
    });

    if (!videoAct) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video not found or does not have this act' },
        { status: 404 }
      );
    }

    // Check if user already has a vote for this act
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_actId: {
          userId: session.user.id,
          actId,
        },
      },
    });

    let vote;
    let isUpdate = false;

    if (existingVote) {
      // Update existing vote to point to new video
      vote = await prisma.vote.update({
        where: { id: existingVote.id },
        data: { videoId },
        include: {
          video: {
            include: {
              acts: { include: { act: true } },
            },
          },
          act: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      isUpdate = true;
    } else {
      // Create new vote
      vote = await prisma.vote.create({
        data: {
          userId: session.user.id,
          videoId,
          actId,
        },
        include: {
          video: {
            include: {
              acts: { include: { act: true } },
            },
          },
          act: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }

    return NextResponse.json<ApiResponse<Vote>>(
      { data: vote as Vote, message: isUpdate ? 'Vote updated' : 'Vote cast' },
      { status: isUpdate ? 200 : 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to cast vote' },
      { status: 500 }
    );
  }
}
