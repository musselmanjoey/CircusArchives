import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DiscoveryStatus } from '@prisma/client';
import type { ApiResponse, DiscoveredVideo } from '@/types';

/**
 * GET /api/discovery
 * Fetch discovered videos with optional status filter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DiscoveryStatus | null;
    const stats = searchParams.get('stats') === 'true';

    const where = status ? { status } : {};

    const items = await prisma.discoveredVideo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Get stats if requested
    let statsData = null;
    if (stats) {
      const [pending, approved, rejected, pushed] = await Promise.all([
        prisma.discoveredVideo.count({ where: { status: 'PENDING' } }),
        prisma.discoveredVideo.count({ where: { status: 'APPROVED' } }),
        prisma.discoveredVideo.count({ where: { status: 'REJECTED' } }),
        prisma.discoveredVideo.count({ where: { status: 'PUSHED' } }),
      ]);
      statsData = { pending, approved, rejected, pushed };
    }

    return NextResponse.json<ApiResponse<{ items: DiscoveredVideo[]; stats: typeof statsData }>>({
      data: { items: items as DiscoveredVideo[], stats: statsData },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch discovered videos';
    return NextResponse.json<ApiResponse<null>>({ error: message }, { status: 500 });
  }
}
