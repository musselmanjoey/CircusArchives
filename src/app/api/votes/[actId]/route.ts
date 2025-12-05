import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/types';

interface RouteParams {
  params: Promise<{ actId: string }>;
}

// DELETE /api/votes/:actId - Remove vote for an act
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { actId } = await params;

    // Find and delete the vote
    const vote = await prisma.vote.findUnique({
      where: {
        userId_actId: {
          userId: session.user.id,
          actId,
        },
      },
    });

    if (!vote) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Vote not found' },
        { status: 404 }
      );
    }

    await prisma.vote.delete({
      where: { id: vote.id },
    });

    return NextResponse.json<ApiResponse<null>>(
      { message: 'Vote removed' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
