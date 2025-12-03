import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { getThumbnailUrl } from '@/lib/youtube';
import type { Video } from '@/types';

export interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const thumbnailUrl = getThumbnailUrl(video.youtubeId, 'medium');

  return (
    <Link href={`/videos/${video.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="aspect-video relative">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {video.year}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-1">
            {video.act?.name || 'Unknown Act'}
          </h3>
          {video.performers && video.performers.length > 0 && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {video.performers.map((vp) => `${vp.user.firstName} ${vp.user.lastName}`).join(', ')}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
