'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CommentForm } from './CommentForm';
import type { Comment } from '@/types';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CommentItem({
  comment,
  currentUserId,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === comment.userId;
  const authorName = comment.user
    ? `${comment.user.firstName} ${comment.user.lastName}`
    : 'Unknown';

  const formattedDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="py-3 border-b border-gray-100 last:border-b-0">
        <CommentForm
          onSubmit={handleEdit}
          initialValue={comment.content}
          submitLabel="Save"
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 text-sm">{authorName}</span>
            <span className="text-gray-400 text-xs">{formattedDate}</span>
          </div>
          <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-gray-700 px-2"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 px-2"
            >
              {isDeleting ? '...' : 'Delete'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
