import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractYouTubeId, isValidYouTubeUrl } from '@/lib/youtube';
import type { VideoCreateInput, ApiResponse, Video } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const actId = searchParams.get('actId');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = {};

    if (actId) {
      where.actId = actId;
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: { act: true },
        orderBy: { createdAt: 'desc' },
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
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    if (!body.title?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.actId) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Act category is required' },
        { status: 400 }
      );
    }

    // Create video
    const video = await prisma.video.create({
      data: {
        youtubeUrl: body.youtubeUrl,
        youtubeId,
        title: body.title.trim(),
        year: body.year,
        description: body.description?.trim() || null,
        actId: body.actId,
      },
      include: { act: true },
    });

    return NextResponse.json<ApiResponse<Video>>(
      { data: video as Video, message: 'Video created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}
