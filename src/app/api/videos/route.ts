import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { extractYouTubeId, isValidYouTubeUrl } from '@/lib/youtube';
import type { VideoCreateInput, ApiResponse, Video } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const actId = searchParams.get('actId');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const performerId = searchParams.get('performerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort'); // 'votes' for leaderboard view

    const where: Record<string, unknown> = {};

    if (actId) {
      where.actId = actId;
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (performerId) {
      where.performers = {
        some: { userId: performerId },
      };
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { act: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Determine sort order
    let orderBy: Record<string, unknown> = { createdAt: 'desc' };

    if (sort === 'votes') {
      // Sort by vote count (calculated with performer 2x bonus)
      const videosWithVotes = await prisma.video.findMany({
        where,
        include: {
          act: true,
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
        return { ...video, voteScore, votes: undefined };
      });

      // Sort by vote score descending
      scoredVideos.sort((a, b) => b.voteScore - a.voteScore);

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
          act: true,
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

    return NextResponse.json({
      data: videos,
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

    // Validate required fields
    if (!body.actId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Act category is required' },
        { status: 400 }
      );
    }

    // Get act name to generate title
    const act = await prisma.act.findUnique({
      where: { id: body.actId },
      select: { name: true },
    });

    if (!act) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Invalid act category' },
        { status: 400 }
      );
    }

    // Generate title from act + year
    const title = `${act.name} ${body.year}`;

    // Create video with uploader and performers
    const video = await prisma.video.create({
      data: {
        youtubeUrl: body.youtubeUrl,
        youtubeId,
        title,
        year: body.year,
        description: body.description?.trim() || null,
        actId: body.actId,
        uploaderId: session.user.id,
        performers: body.performerIds?.length
          ? {
              create: body.performerIds.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        act: true,
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

    return NextResponse.json<ApiResponse<Video>>(
      { data: video as Video, message: 'Video created successfully' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}
