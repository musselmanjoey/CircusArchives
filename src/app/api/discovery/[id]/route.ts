import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DiscoveryStatus } from '@prisma/client';
import type { ApiResponse, DiscoveredVideo, DiscoveredVideoUpdateInput } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/discovery/[id]
 * Fetch a single discovered video
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const item = await prisma.discoveredVideo.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Discovered video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<DiscoveredVideo>>({
      data: item as DiscoveredVideo,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch discovered video';
    return NextResponse.json<ApiResponse<null>>({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/discovery/[id]
 * Update a discovered video (edit metadata, change status)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: DiscoveredVideoUpdateInput = await request.json();

    // Validate status if provided
    if (body.status && !['PENDING', 'APPROVED', 'REJECTED', 'PUSHED'].includes(body.status)) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updated = await prisma.discoveredVideo.update({
      where: { id },
      data: {
        ...(body.inferredYear !== undefined && { inferredYear: body.inferredYear }),
        ...(body.inferredShowType !== undefined && { inferredShowType: body.inferredShowType }),
        ...(body.inferredActNames !== undefined && { inferredActNames: body.inferredActNames }),
        ...(body.inferredPerformers !== undefined && { inferredPerformers: body.inferredPerformers }),
        ...(body.status !== undefined && { status: body.status as DiscoveryStatus }),
        ...(body.reviewNotes !== undefined && { reviewNotes: body.reviewNotes }),
      },
    });

    return NextResponse.json<ApiResponse<DiscoveredVideo>>({
      data: updated as DiscoveredVideo,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update discovered video';
    return NextResponse.json<ApiResponse<null>>({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/discovery/[id]
 * Delete a discovered video
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.discoveredVideo.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      data: { success: true },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete discovered video';
    return NextResponse.json<ApiResponse<null>>({ error: message }, { status: 500 });
  }
}
