import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse, VideoRanking, ActRanking } from '@/types';

// GET /api/rankings - Get rankings for all acts or a specific act
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const actId = searchParams.get('actId');

    if (actId) {
      // Get rankings for a specific act
      const rankings = await getActVideoRankings(actId);
      return NextResponse.json<ApiResponse<VideoRanking[]>>({ data: rankings });
    } else {
      // Get top video for each act
      const rankings = await getAllActRankings();
      return NextResponse.json<ApiResponse<ActRanking[]>>({ data: rankings });
    }
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}

// Get all videos for an act ranked by votes
async function getActVideoRankings(actId: string): Promise<VideoRanking[]> {
  // Get all videos for this act with their votes
  const videos = await prisma.video.findMany({
    where: { actId },
    include: {
      act: true,
      performers: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      votes: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { year: 'desc' },
  });

  // Calculate vote counts with performer bonus
  const rankings: VideoRanking[] = videos.map((video) => {
    const performerUserIds = new Set(video.performers.map((p) => p.userId));

    let voteCount = 0;
    for (const vote of video.votes) {
      // Check if the voter is a performer in ANY video for this act
      // For simplicity, we check if they're a performer in THIS video
      // TODO: Could extend to check if performer in any video of the same act
      if (performerUserIds.has(vote.userId)) {
        voteCount += 2; // Performer bonus
      } else {
        voteCount += 1;
      }
    }

    return {
      videoId: video.id,
      video: {
        id: video.id,
        youtubeUrl: video.youtubeUrl,
        youtubeId: video.youtubeId,
        title: video.title,
        year: video.year,
        description: video.description ?? undefined,
        actId: video.actId,
        act: video.act,
        performers: video.performers,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      },
      actId: video.actId,
      act: video.act,
      voteCount,
      voterCount: video.votes.length,
    };
  });

  // Sort by vote count descending
  rankings.sort((a, b) => b.voteCount - a.voteCount);

  return rankings;
}

// Get top video for each act
async function getAllActRankings(): Promise<ActRanking[]> {
  // Get all acts
  const acts = await prisma.act.findMany({
    orderBy: { name: 'asc' },
  });

  const rankings: ActRanking[] = [];

  for (const act of acts) {
    // Get video rankings for this act
    const videoRankings = await getActVideoRankings(act.id);

    // Top video is the first one (highest votes)
    const topRanking = videoRankings[0];

    rankings.push({
      act,
      topVideo: topRanking?.video ?? null,
      totalVotes: topRanking?.voteCount ?? 0,
    });
  }

  return rankings;
}
