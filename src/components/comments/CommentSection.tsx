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
    <Card data-testid="comments-section">
      <CardHeader>
        <CardTitle>Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {session?.user ? (
          <CommentForm onSubmit={handleCreate} />
        ) : (
          <p className="text-sm text-gray-500 py-2">
            Log in to leave a comment
          </p>
        )}

        {isLoading ? (
          <p className="text-gray-500 text-sm py-4">Loading comments...</p>
        ) : error ? (
          <p className="text-red-500 text-sm py-4">{error}</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
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
