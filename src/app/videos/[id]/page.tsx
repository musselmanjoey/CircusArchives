'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { Button } from '@/components/ui/Button';
import type { Video, ApiResponse } from '@/types';

interface VideoPageProps {
  params: Promise<{ id: string }>;
}

export default function VideoPage({ params }: VideoPageProps) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(`/api/videos/${id}`);
        if (!response.ok) {
          setVideo(null);
          return;
        }
        const result: ApiResponse<Video> = await response.json();
        setVideo(result.data || null);
      } catch (error) {
        console.error('Error fetching video:', error);
        setVideo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const isOwner = video?.uploaderId === session?.user?.id;
  const canEdit = isOwner || (session?.user as { role?: string })?.role === 'admin';

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/videos');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{video.act?.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">{video.year}</span>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Link href={`/videos/${id}/edit`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            )}
          </div>

          {video.performers && video.performers.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Performers</h2>
              <div className="flex flex-wrap gap-2">
                {video.performers.map((vp) => (
                  <span
                    key={vp.id}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {vp.user.firstName} {vp.user.lastName}
                  </span>
                ))}
              </div>
            </div>
          )}

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
