import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, Comment, CommentUpdateInput } from '@/types';

const MAX_COMMENT_LENGTH = 140;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: CommentUpdateInput = await request.json();

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

    // Find the comment and verify ownership
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content: body.content.trim() },
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

    return NextResponse.json<ApiResponse<Comment>>({
      data: comment as Comment,
      message: 'Comment updated successfully',
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Find the comment and verify ownership
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    await prisma.comment.delete({ where: { id } });

    return NextResponse.json<ApiResponse<null>>({
      message: 'Comment deleted successfully',
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
