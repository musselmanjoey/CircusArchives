import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, Comment, CommentCreateInput } from '@/types';

const MAX_COMMENT_LENGTH = 140;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { videoId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json<ApiResponse<Comment[]>>({ data: comments as Comment[] });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CommentCreateInput = await request.json();

    if (!body.content?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (body.content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json<ApiResponse<null>>(
        { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (!body.videoId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: body.videoId },
    });

    if (!video) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: body.content.trim(),
        userId: session.user.id,
        videoId: body.videoId,
      },
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

    return NextResponse.json<ApiResponse<Comment>>(
      { data: comment as Comment, message: 'Comment created successfully' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
