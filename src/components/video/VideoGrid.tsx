import Link from 'next/link';
import { VideoCard } from './VideoCard';
import { Button } from '@/components/ui/Button';
import type { Video } from '@/types';

export interface VideoGridProps {
  videos: Video[];
  emptyMessage?: string;
  showVotes?: boolean;
}

export function VideoGrid({ videos, emptyMessage = 'No videos found.', showVotes = false }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-text-muted mb-4">{emptyMessage}</p>
        <Link href="/submit">
          <Button variant="outline">Submit a Video</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {videos.map((video, index) => (
        <VideoCard
          key={video.id}
          video={video}
          showVotes={showVotes}
          rank={showVotes ? index + 1 : undefined}
        />
      ))}
    </div>
  );
}
