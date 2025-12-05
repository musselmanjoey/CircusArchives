'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getThumbnailUrl } from '@/lib/youtube';
import type { ActRanking, ApiResponse } from '@/types';

export default function HomePage() {
  const [rankings, setRankings] = useState<ActRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/rankings');
        if (response.ok) {
          const data: ApiResponse<ActRanking[]> = await response.json();
          setRankings(data.data || []);
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  // Separate acts with votes from those without
  const actsWithVotes = rankings.filter((r) => r.totalVotes > 0);
  const actsWithoutVotes = rankings.filter((r) => r.totalVotes === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Best Circus Performances
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Community-voted favorites from the FSU Flying High Circus archive.
          Vote for your favorite performance in each act category!
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading rankings...</p>
        </div>
      ) : (
        <>
          {/* Acts with votes - featured section */}
          {actsWithVotes.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Top Voted Performances
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {actsWithVotes.map((ranking) => (
                  <RankingCard key={ranking.act.id} ranking={ranking} featured />
                ))}
              </div>
            </section>
          )}

          {/* Acts without votes */}
          {actsWithoutVotes.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {actsWithVotes.length > 0 ? 'More Acts' : 'All Acts'}
              </h2>
              <p className="text-gray-600 mb-6">
                These acts need your votes! Browse and vote for your favorites.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {actsWithoutVotes.map((ranking) => (
                  <RankingCard key={ranking.act.id} ranking={ranking} />
                ))}
              </div>
            </section>
          )}

          {/* No rankings at all */}
          {rankings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No acts found in the archive yet.</p>
              <Link href="/submit">
                <Button>Submit the first video</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface RankingCardProps {
  ranking: ActRanking;
  featured?: boolean;
}

function RankingCard({ ranking, featured }: RankingCardProps) {
  const { act, topVideo, totalVotes } = ranking;

  if (topVideo) {
    const thumbnailUrl = getThumbnailUrl(topVideo.youtubeId, 'medium');

    // Format performers list with truncation
    const performers = topVideo.performers || [];
    const maxDisplayed = 3;
    const displayedPerformers = performers.slice(0, maxDisplayed);
    const remainingCount = performers.length - maxDisplayed;
    const performerText = displayedPerformers
      .map((p) => `${p.user.firstName} ${p.user.lastName}`)
      .join(', ');

    return (
      <Link href={`/videos/${topVideo.id}`}>
        <Card className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${featured ? 'ring-2 ring-yellow-400' : ''}`}>
          <div className="aspect-video relative">
            <img
              src={thumbnailUrl}
              alt={act.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
              #{1} Best
            </div>
            <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
              {topVideo.year}
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg text-gray-900">{act.name}</h3>
            {performers.length > 0 && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {performerText}
                {remainingCount > 0 && (
                  <span className="text-gray-400"> +{remainingCount} more</span>
                )}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-blue-600 font-medium">
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </span>
              <span className="text-xs text-gray-500">
                Click to view & vote
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Act without a top video (no votes yet)
  return (
    <Link href={`/videos?actId=${act.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🎪</div>
            <p className="text-sm text-gray-500">No votes yet</p>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg text-gray-900">{act.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Be the first to vote!
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
