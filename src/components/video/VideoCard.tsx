import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { getThumbnailUrl } from '@/lib/youtube';
import type { Video } from '@/types';

export interface VideoCardProps {
  video: Video;
  showVotes?: boolean;
  rank?: number;
}

export function VideoCard({ video, showVotes = false, rank }: VideoCardProps) {
  const thumbnailUrl = getThumbnailUrl(video.youtubeId, 'medium');
  const performers = video.performers || [];
  const performerText = performers
    .slice(0, 2)
    .map((p) => `${p.user.firstName} ${p.user.lastName}`)
    .join(', ');
  const moreCount = performers.length - 2;

  return (
    <Link href={`/videos/${video.id}`}>
      <Card hoverable className="overflow-hidden h-full">
        <div className="aspect-video relative">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Rank badge */}
          {rank && (
            <div className="absolute top-3 left-3 bg-gold text-garnet-dark text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              #{rank}
            </div>
          )}

          {/* Year badge */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {video.year}
          </div>

          {/* Vote count badge */}
          {showVotes && video.voteCount !== undefined && video.voteCount > 0 && (
            <div className="absolute bottom-3 left-3 bg-garnet/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {video.voteCount}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-text line-clamp-1">
            {video.act?.name || 'Unknown Act'}
          </h3>
          {performers.length > 0 && (
            <p className="text-sm text-text-muted mt-1 line-clamp-1">
              {performerText}
              {moreCount > 0 && (
                <span className="text-text-light"> +{moreCount} more</span>
              )}
            </p>
          )}
          {performers.length === 0 && (
            <p className="text-sm text-text-light mt-1 italic">
              No performers tagged
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
