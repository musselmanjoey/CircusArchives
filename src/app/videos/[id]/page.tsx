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
import { PerformerSelector } from '@/components/video/PerformerSelector';
import type { Video, ApiResponse, Performer, VideoPerformer } from '@/types';

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
  const [showPerformerForm, setShowPerformerForm] = useState(false);
  const [selectedPerformers, setSelectedPerformers] = useState<Performer[]>([]);
  const [isSavingPerformers, setIsSavingPerformers] = useState(false);

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

  const handleSavePerformers = async () => {
    if (selectedPerformers.length === 0) return;

    setIsSavingPerformers(true);
    try {
      const response = await fetch(`/api/videos/${id}/performers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performerIds: selectedPerformers.map((p) => p.id),
        }),
      });

      const result: ApiResponse<VideoPerformer[]> = await response.json();

      if (response.ok && result.data) {
        // Update local video state with new performers
        setVideo((prev) => prev ? { ...prev, performers: result.data } : null);
        setSelectedPerformers([]);
        setShowPerformerForm(false);
      } else {
        alert(result.error || 'Failed to add performers');
      }
    } catch {
      alert('Failed to add performers');
    } finally {
      setIsSavingPerformers(false);
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
                  {video.acts?.length
                    ? video.acts.map((va) => va.act.name).join(' / ')
                    : video.act?.name || 'Unknown Act'}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/20 text-garnet-dark rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {video.year}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-garnet/10 text-garnet rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {video.showType === 'CALLAWAY' ? 'Callaway Show' : 'Home Show'}
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

            {/* Voting Section - show for each act */}
            {(video.acts?.length || video.act) && (
              <div className="space-y-3 mb-6">
                {video.acts?.length ? (
                  video.acts.map((va) => (
                    <div key={va.actId} className="bg-surface rounded-xl p-4">
                      <VoteInfo
                        videoId={video.id}
                        actId={va.actId}
                        actName={va.act.name}
                      />
                    </div>
                  ))
                ) : video.act ? (
                  <div className="bg-surface rounded-xl p-4">
                    <VoteInfo
                      videoId={video.id}
                      actId={video.act.id}
                      actName={video.act.name}
                    />
                  </div>
                ) : null}
              </div>
            )}

            {/* Performers Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                  Performers
                </h2>
                {session?.user && !showPerformerForm && (
                  <button
                    onClick={() => setShowPerformerForm(true)}
                    className="text-sm text-garnet hover:text-garnet-dark flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Performer
                  </button>
                )}
              </div>

              {/* Existing performers */}
              {video.performers && video.performers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
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
              )}

              {/* No performers yet - prompt */}
              {(!video.performers || video.performers.length === 0) && !showPerformerForm && (
                video.needsPerformers ? (
                  session?.user ? (
                    <div className="p-4 bg-gold/10 border border-gold/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-gold-dark" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gold-dark mb-1">Know who&apos;s in this video?</h3>
                          <p className="text-sm text-text-secondary mb-3">
                            Help us identify the performers! Click below to tag them.
                          </p>
                          <Button size="sm" variant="secondary" onClick={() => setShowPerformerForm(true)}>
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Tag Performers
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface border border-border rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-garnet/10 rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-garnet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-text mb-1">Want to help identify performers?</h3>
                          <p className="text-sm text-text-secondary mb-3">
                            Log in to tag performers, vote for your favorites, and leave comments.
                          </p>
                          <Link href="/login">
                            <Button size="sm">
                              Log In
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-text-muted">No performers tagged yet.</p>
                )
              )}

              {/* Inline performer tagging form */}
              {showPerformerForm && session?.user && (
                <div className="p-4 bg-surface border border-border rounded-xl">
                  <PerformerSelector
                    selectedPerformers={selectedPerformers}
                    onChange={setSelectedPerformers}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={handleSavePerformers}
                      disabled={selectedPerformers.length === 0 || isSavingPerformers}
                      isLoading={isSavingPerformers}
                    >
                      {isSavingPerformers ? 'Saving...' : 'Save Performers'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowPerformerForm(false);
                        setSelectedPerformers([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

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
