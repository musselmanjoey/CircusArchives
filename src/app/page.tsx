'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getThumbnailUrl } from '@/lib/youtube';
import type { HomepageRankings, TopVideo, ActRanking, ApiResponse } from '@/types';

export default function HomePage() {
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [acts, setActs] = useState<ActRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/rankings');
        if (response.ok) {
          const data: ApiResponse<HomepageRankings> = await response.json();
          setTopVideos(data.data?.topVideos || []);
          setActs(data.data?.acts || []);
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  return (
    <div className="min-h-[80vh]">
      {/* Hero Section */}
      <section className="bg-gradient-garnet text-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 animate-fade-in">
            Best Circus Performances
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 animate-slide-up">
            Community-voted favorites from the FSU Flying High Circus archive.
            Vote for your favorite performance in each act category!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up">
            <Link href="/videos">
              <Button variant="gold" size="lg">
                Browse All Videos
              </Button>
            </Link>
            <Link href="/submit">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-garnet">
                Submit a Video
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video skeleton" />
                <CardContent className="p-4">
                  <div className="h-5 skeleton rounded w-2/3 mb-2" />
                  <div className="h-4 skeleton rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Top 6 Videos Section */}
            {topVideos.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gold rounded-full" />
                  <h2 className="text-2xl font-bold text-text">
                    Top Voted Performances
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topVideos.map((item, index) => (
                    <TopVideoCard key={item.video.id} item={item} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* All Acts Section */}
            {acts.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 bg-border-strong rounded-full" />
                  <h2 className="text-2xl font-bold text-text">
                    Browse by Act
                  </h2>
                </div>
                <p className="text-text-muted mb-6">
                  Explore all act categories and vote for your favorites.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {acts.map((ranking) => (
                    <ActCard key={ranking.act.id} ranking={ranking} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {topVideos.length === 0 && acts.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🎪</span>
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">
                  No videos in the archive yet
                </h3>
                <p className="text-text-muted mb-6 max-w-md mx-auto">
                  Be the first to contribute! Add a circus performance video to start building our community archive.
                </p>
                <Link href="/submit">
                  <Button size="lg">Submit the First Video</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// Card for top 6 videos - links to video page
interface TopVideoCardProps {
  item: TopVideo;
  rank: number;
}

function TopVideoCard({ item, rank }: TopVideoCardProps) {
  const { video, act, voteCount } = item;
  const thumbnailUrl = getThumbnailUrl(video.youtubeId, 'medium');
  const performers = video.performers || [];
  const maxDisplayed = 3;
  const displayedPerformers = performers.slice(0, maxDisplayed);
  const remainingCount = performers.length - maxDisplayed;
  const performerText = displayedPerformers
    .map((p) => `${p.user.firstName} ${p.user.lastName}`)
    .join(', ');

  return (
    <Link href={`/videos/${video.id}`}>
      <Card variant="featured" hoverable className="overflow-hidden h-full">
        <div className="aspect-video relative">
          <img
            src={thumbnailUrl}
            alt={video.title || act.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Rank badge */}
          <div className="absolute top-3 left-3 bg-gold text-garnet-dark text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            #{rank}
          </div>

          {/* Year badge */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {video.year}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg text-text">{act.name}</h3>
          {performers.length > 0 && (
            <p className="text-sm text-text-muted mt-1 line-clamp-1">
              {performerText}
              {remainingCount > 0 && (
                <span className="text-text-light"> +{remainingCount} more</span>
              )}
            </p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-sm font-semibold text-garnet">
              {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
            </span>
            <span className="text-xs text-text-muted flex items-center gap-1">
              Watch video
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Card for acts section - links to leaderboard
interface ActCardProps {
  ranking: ActRanking;
}

function ActCard({ ranking }: ActCardProps) {
  const { act, topVideo, totalVotes } = ranking;
  const leaderboardUrl = `/videos?actId=${act.id}&sort=votes`;

  if (topVideo) {
    const thumbnailUrl = getThumbnailUrl(topVideo.youtubeId, 'medium');

    return (
      <Link href={leaderboardUrl}>
        <Card hoverable className="overflow-hidden h-full">
          <div className="aspect-video relative">
            <img
              src={thumbnailUrl}
              alt={act.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {totalVotes > 0 && (
              <div className="absolute top-3 right-3 bg-garnet/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-text">{act.name}</h3>
            <span className="text-xs text-text-muted flex items-center gap-1 mt-2">
              View leaderboard
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Act without videos
  return (
    <Link href={leaderboardUrl}>
      <Card hoverable className="overflow-hidden h-full">
        <div className="aspect-video relative bg-surface flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl">🎪</span>
            </div>
            <p className="text-xs text-text-muted">No videos yet</p>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-text">{act.name}</h3>
          <p className="text-xs text-garnet mt-1 font-medium">
            Add the first video!
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
