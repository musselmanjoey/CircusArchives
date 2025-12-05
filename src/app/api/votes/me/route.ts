import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, Vote } from '@/types';

// GET /api/votes/me - Get current user's votes
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const votes = await prisma.vote.findMany({
      where: { userId: session.user.id },
      include: {
        video: {
          include: {
            act: true,
            performers: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        act: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json<ApiResponse<Vote[]>>({ data: votes as Vote[] });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}
