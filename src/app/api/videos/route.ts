import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { extractYouTubeId, isValidYouTubeUrl } from '@/lib/youtube';
import type { VideoCreateInput, ApiResponse, Video, ShowType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const actId = searchParams.get('actId');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const performerId = searchParams.get('performerId');
    const showType = searchParams.get('showType') as ShowType | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort'); // 'votes' for leaderboard view

    const where: Record<string, unknown> = {};

    // V5: Filter by act via join table
    if (actId) {
      where.acts = {
        some: { actId },
      };
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (showType) {
      where.showType = showType;
    }

    if (performerId) {
      where.performers = {
        some: { userId: performerId },
      };
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { acts: { some: { act: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    // Determine sort order
    const orderBy: Record<string, unknown> = { createdAt: 'desc' };

    if (sort === 'votes') {
      // Sort by vote count (calculated with performer 2x bonus)
      const videosWithVotes = await prisma.video.findMany({
        where,
        include: {
          acts: {
            include: {
              act: true,
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
          votes: {
            include: {
              user: true,
            },
          },
        },
      });

      // Calculate vote scores (performer votes = 2x)
      const scoredVideos = videosWithVotes.map((video) => {
        const performerIds = new Set(video.performers.map((p) => p.userId));
        let voteScore = 0;
        for (const vote of video.votes) {
          voteScore += performerIds.has(vote.userId) ? 2 : 1;
        }
        // Add first act as legacy `act` field for backward compat
        const act = video.acts[0]?.act || null;
        return { ...video, act, voteCount: voteScore, votes: undefined };
      });

      // Sort by vote score descending
      scoredVideos.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

      // Paginate
      const paginatedVideos = scoredVideos.slice((page - 1) * limit, page * limit);
      const total = scoredVideos.length;

      return NextResponse.json({
        data: paginatedVideos,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          acts: {
            include: {
              act: true,
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
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.video.count({ where }),
    ]);

    // Add legacy `act` field for backward compat
    const videosWithAct = videos.map((video) => ({
      ...video,
      act: video.acts[0]?.act || null,
    }));

    return NextResponse.json({
      data: videosWithAct,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: VideoCreateInput = await request.json();

    // Validate YouTube URL
    if (!isValidYouTubeUrl(body.youtubeUrl)) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const youtubeId = extractYouTubeId(body.youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Could not extract YouTube video ID' },
        { status: 400 }
      );
    }

    // V5: Validate required fields
    if (!body.actIds || body.actIds.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'At least one act category is required' },
        { status: 400 }
      );
    }

    if (!body.showType) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Show type is required' },
        { status: 400 }
      );
    }

    // Get act names to generate title
    const acts = await prisma.act.findMany({
      where: { id: { in: body.actIds } },
      select: { id: true, name: true },
    });

    if (acts.length !== body.actIds.length) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'One or more invalid act categories' },
        { status: 400 }
      );
    }

    // Generate title from acts + year
    const actNames = acts.map((a) => a.name).join(' / ');
    const title = `${actNames} ${body.year}`;

    // Create video with uploader, acts, and performers
    const video = await prisma.video.create({
      data: {
        youtubeUrl: body.youtubeUrl,
        youtubeId,
        title,
        year: body.year,
        description: body.description?.trim() || null,
        showType: body.showType,
        uploaderId: session.user.id,
        acts: {
          create: body.actIds.map((actId: string) => ({
            actId,
          })),
        },
        performers: body.performerIds?.length
          ? {
              create: body.performerIds.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        acts: {
          include: {
            act: true,
          },
        },
        uploader: true,
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

    return NextResponse.json<ApiResponse<Video>>(
      { data: videoWithAct as Video, message: 'Video created successfully' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}
