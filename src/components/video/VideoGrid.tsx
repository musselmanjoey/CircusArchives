import { VideoCard } from './VideoCard';
import type { Video } from '@/types';

export interface VideoGridProps {
  videos: Video[];
  emptyMessage?: string;
}

export function VideoGrid({ videos, emptyMessage = 'No videos found.' }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
