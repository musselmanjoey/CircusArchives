import { notFound } from 'next/navigation';
import Link from 'next/link';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { Button } from '@/components/ui/Button';
import { prisma } from '@/lib/db';
import type { Video } from '@/types';

interface VideoPageProps {
  params: Promise<{ id: string }>;
}

async function getVideo(id: string): Promise<Video | null> {
  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: { act: true, uploader: true },
    });

    if (!video) return null;

    return {
      id: video.id,
      youtubeUrl: video.youtubeUrl,
      youtubeId: video.youtubeId,
      title: video.title,
      year: video.year,
      description: video.description || undefined,
      actId: video.actId,
      act: {
        ...video.act,
        description: video.act.description || undefined,
      },
      uploaderId: video.uploaderId || undefined,
      uploader: video.uploader ? {
        id: video.uploader.id,
        firstName: video.uploader.firstName,
        lastName: video.uploader.lastName,
        email: video.uploader.email || undefined,
        image: video.uploader.image || undefined,
        createdAt: video.uploader.createdAt,
        updatedAt: video.uploader.updatedAt,
      } : undefined,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching video:', error);
    return null;
  }
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/videos">
        <Button variant="ghost" className="mb-4">
          &larr; Back to Videos
        </Button>
      </Link>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <VideoPlayer youtubeId={video.youtubeId} title={video.title} />

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{video.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">{video.year}</span>
                <span>•</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                  {video.act?.name}
                </span>
              </div>
            </div>
          </div>

          {video.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{video.description}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Added on {new Date(video.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {video.uploader && (
                <span> by <span className="font-medium text-gray-700">{video.uploader.firstName} {video.uploader.lastName}</span></span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
