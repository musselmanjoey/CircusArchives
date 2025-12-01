'use client';

import { getEmbedUrl } from '@/lib/youtube';

export interface VideoPlayerProps {
  youtubeId: string;
  title: string;
}

export function VideoPlayer({ youtubeId, title }: VideoPlayerProps) {
  const embedUrl = getEmbedUrl(youtubeId);

  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-lg"
      />
    </div>
  );
}
