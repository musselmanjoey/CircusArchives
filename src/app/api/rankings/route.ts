import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse, VideoRanking, ActRanking, Video } from '@/types';

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
// V5: Uses VideoAct join table for many-to-many relationship
async function getActVideoRankings(actId: string): Promise<VideoRanking[]> {
  // Get the act
  const act = await prisma.act.findUnique({
    where: { id: actId },
  });

  if (!act) {
    return [];
  }

  // Get all videos that have this act via the join table
  const videoActs = await prisma.videoAct.findMany({
    where: { actId },
    include: {
      video: {
        include: {
          acts: {
            include: {
              act: true,
            },
          },
          performers: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          votes: {
            where: { actId }, // Only votes for this specific act
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  // Calculate vote counts with performer bonus
  const rankings: VideoRanking[] = videoActs.map(({ video }) => {
    const performerUserIds = new Set(video.performers.map((p) => p.userId));

    let voteCount = 0;
    for (const vote of video.votes) {
      if (performerUserIds.has(vote.userId)) {
        voteCount += 2; // Performer bonus
      } else {
        voteCount += 1;
      }
    }

    // Build video object with legacy act field for backward compat
    const videoData: Video = {
      id: video.id,
      youtubeUrl: video.youtubeUrl,
      youtubeId: video.youtubeId,
      title: video.title,
      year: video.year,
      description: video.description ?? undefined,
      showType: video.showType,
      acts: video.acts,
      act: video.acts[0]?.act || null,
      performers: video.performers,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };

    return {
      videoId: video.id,
      video: videoData,
      actId,
      act,
      voteCount,
      voterCount: video.votes.length,
    };
  });

  // Sort by vote count descending, then by year descending
  rankings.sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }
    return b.video.year - a.video.year;
  });

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
