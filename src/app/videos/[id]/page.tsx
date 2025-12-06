'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { VoteInfo } from '@/components/voting/VoteInfo';
import { CommentSection } from '@/components/comments';
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
      } catch {
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
    } catch {
      alert('Failed to delete video');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 skeleton rounded w-32 mb-6" />
          <Card className="overflow-hidden">
            <div className="aspect-video skeleton" />
            <CardContent className="p-6">
              <div className="h-8 skeleton rounded w-1/3 mb-4" />
              <div className="h-5 skeleton rounded w-1/4 mb-6" />
              <div className="h-20 skeleton rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!video) {
    notFound();
  }

  return (
    <div className="min-h-[80vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Link */}
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-text-muted hover:text-garnet transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Videos
        </Link>

        {/* Main Video Card */}
        <Card variant="elevated" className="overflow-hidden">
          <VideoPlayer youtubeId={video.youtubeId} title={video.title} />

          <CardContent className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
                  {video.act?.name}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/20 text-garnet-dark rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {video.year}
                  </span>
                </div>
              </div>

              {canEdit && (
                <div className="flex gap-2 shrink-0">
                  <Link href={`/videos/${id}/edit`}>
                    <Button variant="secondary" size="sm">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    isLoading={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              )}
            </div>

            {/* Voting Section */}
            {video.act && (
              <div className="bg-surface rounded-xl p-4 mb-6">
                <VoteInfo
                  videoId={video.id}
                  actId={video.act.id}
                  actName={video.act.name}
                />
              </div>
            )}

            {/* Performers */}
            {video.performers && video.performers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
                  Performers
                </h2>
                <div className="flex flex-wrap gap-2">
                  {video.performers.map((vp) => (
                    <span
                      key={vp.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-garnet/10 text-garnet rounded-full text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {vp.user.firstName} {vp.user.lastName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {video.description && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
                  Description
                </h2>
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            )}

            {/* Meta Footer */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-muted">
                Added on{' '}
                <span className="text-text-secondary">
                  {new Date(video.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {video.uploader && (
                  <>
                    {' '}by{' '}
                    <span className="font-medium text-text">
                      {video.uploader.firstName} {video.uploader.lastName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentSection videoId={video.id} />
        </div>
      </div>
    </div>
  );
}
