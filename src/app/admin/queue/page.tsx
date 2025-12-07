'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { ApiResponse, UploadQueueItem, UploadStatus } from '@/types';

type FilterStatus = 'ALL' | UploadStatus;

interface QueueStats {
  pending: number;
  uploaded: number;
  failed: number;
  todayUploads: number;
  dailyLimit: number;
}

export default function AdminQueuePage() {
  const { data: session, status: authStatus } = useSession();
  const [queueItems, setQueueItems] = useState<UploadQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<Record<string, string>>({});

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams({ all: 'true', stats: 'true' });
      if (filterStatus !== 'ALL') {
        params.set('status', filterStatus);
      }

      const response = await fetch(`/api/upload?${params}`);
      const result: ApiResponse<{ items: UploadQueueItem[]; stats: QueueStats }> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch queue');
      }

      if (result.data) {
        setQueueItems(result.data.items || []);
        setStats(result.data.stats || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (session) {
      fetchQueue();
    }
  }, [session, fetchQueue]);

  const handleMarkUploaded = async (item: UploadQueueItem) => {
    const youtubeUrl = youtubeUrlInput[item.id];
    if (!youtubeUrl?.trim()) {
      alert('Please enter the YouTube URL');
      return;
    }

    setProcessingId(item.id);
    try {
      const response = await fetch(`/api/upload/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'UPLOADED',
          youtubeUrl: youtubeUrl.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update');
      }

      // Refresh the list
      await fetchQueue();
      setYoutubeUrlInput((prev) => ({ ...prev, [item.id]: '' }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkFailed = async (item: UploadQueueItem, reason: string) => {
    setProcessingId(item.id);
    try {
      const response = await fetch(`/api/upload/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FAILED',
          errorMessage: reason,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update');
      }

      await fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRetry = async (item: UploadQueueItem) => {
    setProcessingId(item.id);
    try {
      const response = await fetch(`/api/upload/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PENDING',
          errorMessage: null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to retry');
      }

      await fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to retry');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (item: UploadQueueItem) => {
    if (!confirm(`Delete "${item.title}"? This will also delete the uploaded file.`)) {
      return;
    }

    setProcessingId(item.id);
    try {
      const response = await fetch(`/api/upload/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete');
      }

      await fetchQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: UploadStatus) => {
    const styles = {
      PENDING: 'bg-gold/20 text-gold-dark',
      UPLOADED: 'bg-success-light text-success',
      FAILED: 'bg-error-light text-error',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // Loading state
  if (authStatus === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card variant="elevated" className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 skeleton rounded-xl mx-auto mb-4" />
            <div className="h-6 skeleton rounded w-48 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auth check
  if (!session) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center pt-4">
            <p className="text-text-muted mb-6">
              Please sign in to access the upload queue.
            </p>
            <Link href="/login?callbackUrl=/admin/queue">
              <Button size="lg" className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-garnet rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text">Upload Queue</h1>
              </div>
              <p className="text-text-muted">
                Manage pending video uploads. Upload to YouTube and add the URL here.
              </p>
            </div>

            <Button variant="secondary" onClick={() => fetchQueue()}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-gold/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-gold-dark">{stats.pending}</div>
                <div className="text-sm text-text-muted">Pending</div>
              </div>
              <div className="bg-success-light rounded-lg p-4">
                <div className="text-2xl font-bold text-success">{stats.uploaded}</div>
                <div className="text-sm text-text-muted">Uploaded</div>
              </div>
              <div className="bg-error-light rounded-lg p-4">
                <div className="text-2xl font-bold text-error">{stats.failed}</div>
                <div className="text-sm text-text-muted">Failed</div>
              </div>
              <div className="bg-garnet/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-garnet">
                  {stats.todayUploads}/{stats.dailyLimit}
                </div>
                <div className="text-sm text-text-muted">Today&apos;s Uploads</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['PENDING', 'UPLOADED', 'FAILED', 'ALL'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-garnet text-white'
                  : 'bg-surface text-text-secondary hover:bg-border'
              }`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-light border border-error/20 rounded-xl p-4 mb-6">
            <p className="text-error">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-6">
                  <div className="h-6 skeleton rounded w-1/3 mb-4" />
                  <div className="h-4 skeleton rounded w-1/2 mb-2" />
                  <div className="h-4 skeleton rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : queueItems.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text mb-2">No uploads found</h3>
              <p className="text-text-muted">
                {filterStatus === 'PENDING'
                  ? 'No videos waiting to be uploaded to YouTube.'
                  : `No ${filterStatus.toLowerCase()} uploads.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {queueItems.map((item) => (
              <Card key={item.id} variant="elevated">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-garnet/10 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-garnet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-text truncate">{item.title}</h3>
                          <p className="text-sm text-text-muted truncate">{item.fileName}</p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-text-muted">Year:</span>
                          <span className="ml-2 text-text">{item.year}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Show:</span>
                          <span className="ml-2 text-text">{item.showType}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Size:</span>
                          <span className="ml-2 text-text">{formatFileSize(item.fileSize)}</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Uploaded:</span>
                          <span className="ml-2 text-text">{formatDate(item.createdAt)}</span>
                        </div>
                      </div>

                      {item.uploader && (
                        <p className="text-sm text-text-secondary mt-2">
                          By: {item.uploader.firstName} {item.uploader.lastName}
                        </p>
                      )}

                      {item.errorMessage && (
                        <p className="text-sm text-error mt-2">Error: {item.errorMessage}</p>
                      )}

                      {item.youtubeUrl && (
                        <a
                          href={item.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-garnet hover:text-garnet-dark mt-2 inline-flex items-center gap-1"
                        >
                          View on YouTube
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-80">
                      {item.status === 'PENDING' && (
                        <>
                          {/* Download Link */}
                          <a
                            href={item.blobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-border hover:text-text transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Video
                          </a>

                          {/* YouTube URL Input */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="YouTube URL after upload"
                              value={youtubeUrlInput[item.id] || ''}
                              onChange={(e) => setYoutubeUrlInput((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))}
                              className="flex-1"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleMarkUploaded(item)}
                              disabled={processingId === item.id || !youtubeUrlInput[item.id]?.trim()}
                              isLoading={processingId === item.id}
                              className="flex-1"
                            >
                              Mark Uploaded
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                const reason = prompt('Reason for failure (optional):');
                                handleMarkFailed(item, reason || 'Upload failed');
                              }}
                              disabled={processingId === item.id}
                            >
                              Failed
                            </Button>
                          </div>
                        </>
                      )}

                      {item.status === 'FAILED' && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleRetry(item)}
                            disabled={processingId === item.id}
                            isLoading={processingId === item.id}
                            className="flex-1"
                          >
                            Retry
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(item)}
                            disabled={processingId === item.id}
                          >
                            Delete
                          </Button>
                        </div>
                      )}

                      {item.status === 'UPLOADED' && (
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(item)}
                          disabled={processingId === item.id}
                          isLoading={processingId === item.id}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
