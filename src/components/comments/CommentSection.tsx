'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import type { Comment, ApiResponse } from '@/types';

interface CommentSectionProps {
  videoId: string;
}

export function CommentSection({ videoId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?videoId=${videoId}`);
      if (!response.ok) throw new Error('Failed to load comments');
      const data: ApiResponse<Comment[]> = await response.json();
      setComments(data.data || []);
      setError(null);
    } catch {
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const handleCreate = async (content: string) => {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, videoId }),
    });

    if (!response.ok) {
      const data: ApiResponse<null> = await response.json();
      throw new Error(data.error || 'Failed to post comment');
    }

    const data: ApiResponse<Comment> = await response.json();
    if (data.data) {
      setComments([data.data, ...comments]);
    }
  };

  const handleEdit = async (id: string, content: string) => {
    const response = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const data: ApiResponse<null> = await response.json();
      throw new Error(data.error || 'Failed to update comment');
    }

    const data: ApiResponse<Comment> = await response.json();
    if (data.data) {
      setComments(comments.map((c) => (c.id === id ? data.data! : c)));
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/comments/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      const data: ApiResponse<null> = await response.json();
      throw new Error(data.error || 'Failed to delete comment');
    }

    setComments(comments.filter((c) => c.id !== id));
  };

  return (
    <Card variant="elevated" data-testid="comments-section">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {session?.user ? (
          <CommentForm onSubmit={handleCreate} />
        ) : (
          <div className="bg-surface rounded-lg p-4 text-center">
            <p className="text-sm text-text-muted">
              <a href="/login" className="text-garnet hover:text-garnet-dark font-medium">Log in</a> to leave a comment
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 skeleton rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-1/4" />
                  <div className="h-4 skeleton rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-error-light rounded-lg p-4 text-center">
            <p className="text-error text-sm">{error}</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-text-muted text-sm">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={session?.user?.id}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
