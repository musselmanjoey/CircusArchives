import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ShowType } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types';

// ============================================================================
// PRODUCTION DATABASE CONNECTION
// ============================================================================
// This endpoint writes to the PRODUCTION database, not the local one.
// The prod DB URL should be set in .env.production or passed explicitly.
// ============================================================================

const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL_PROD;

/**
 * POST /api/discovery/push
 * Push approved discovered videos to production database
 *
 * Body: { ids: string[] } - IDs of discovered videos to push
 */
export async function POST(request: NextRequest) {
  try {
    // Validate prod database URL is configured
    if (!PROD_DATABASE_URL) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Production database URL not configured. Set PROD_DATABASE_URL in environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'No video IDs provided' },
        { status: 400 }
      );
    }

    // Fetch the approved videos from LOCAL database
    const discoveredVideos = await prisma.discoveredVideo.findMany({
      where: {
        id: { in: ids },
        status: 'APPROVED',
      },
    });

    if (discoveredVideos.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'No approved videos found with the provided IDs' },
        { status: 400 }
      );
    }

    // Create a separate Prisma client for PRODUCTION
    const prodPrisma = new PrismaClient({
      datasources: {
        db: {
          url: PROD_DATABASE_URL,
        },
      },
    });

    const results: { id: string; success: boolean; prodVideoId?: string; error?: string }[] = [];

    try {
      for (const discovered of discoveredVideos) {
        try {
          // Check if video already exists in prod by youtubeId
          const existingVideo = await prodPrisma.video.findFirst({
            where: { youtubeId: discovered.youtubeId },
          });

          if (existingVideo) {
            // Mark as pushed with existing prod ID
            await prisma.discoveredVideo.update({
              where: { id: discovered.id },
              data: {
                status: 'PUSHED',
                prodVideoId: existingVideo.id,
              },
            });

            results.push({
              id: discovered.id,
              success: true,
              prodVideoId: existingVideo.id,
              error: 'Already exists in production',
            });
            continue;
          }

          // Validate required fields
          if (!discovered.inferredYear) {
            results.push({
              id: discovered.id,
              success: false,
              error: 'Year is required',
            });
            continue;
          }

          if (!discovered.inferredShowType || !['HOME', 'CALLAWAY'].includes(discovered.inferredShowType)) {
            results.push({
              id: discovered.id,
              success: false,
              error: 'Valid show type (HOME or CALLAWAY) is required',
            });
            continue;
          }

          if (!discovered.inferredActNames || discovered.inferredActNames.length === 0) {
            results.push({
              id: discovered.id,
              success: false,
              error: 'At least one act is required',
            });
            continue;
          }

          // Look up act IDs in production
          const prodActs = await prodPrisma.act.findMany({
            where: {
              name: { in: discovered.inferredActNames },
            },
          });

          if (prodActs.length === 0) {
            results.push({
              id: discovered.id,
              success: false,
              error: `Acts not found in production: ${discovered.inferredActNames.join(', ')}`,
            });
            continue;
          }

          // Generate title from act names + year
          const actNames = prodActs.map(a => a.name);
          const title = `${actNames.join(' / ')} ${discovered.inferredYear}`;

          // Create video in PRODUCTION
          const prodVideo = await prodPrisma.video.create({
            data: {
              youtubeUrl: discovered.youtubeUrl,
              youtubeId: discovered.youtubeId,
              title,
              year: discovered.inferredYear,
              description: discovered.rawDescription || null,
              showType: discovered.inferredShowType as ShowType,
              // No uploader - these are discovered videos
            },
          });

          // Create VideoAct relationships in production
          await prodPrisma.videoAct.createMany({
            data: prodActs.map(act => ({
              videoId: prodVideo.id,
              actId: act.id,
            })),
          });

          // Update local record as PUSHED
          await prisma.discoveredVideo.update({
            where: { id: discovered.id },
            data: {
              status: 'PUSHED',
              prodVideoId: prodVideo.id,
            },
          });

          results.push({
            id: discovered.id,
            success: true,
            prodVideoId: prodVideo.id,
          });
        } catch (err) {
          results.push({
            id: discovered.id,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    } finally {
      await prodPrisma.$disconnect();
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json<ApiResponse<{
      results: typeof results;
      summary: { success: number; failed: number };
    }>>({
      data: {
        results,
        summary: { success: successCount, failed: failCount },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to push videos to production';
    return NextResponse.json<ApiResponse<null>>({ error: message }, { status: 500 });
  }
}
