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

  const authorInitial = comment.user?.firstName?.charAt(0).toUpperCase() || '?';

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
      <div className="py-4">
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
    <div className="py-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 bg-garnet/10 rounded-full flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-garnet">{authorInitial}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-text text-sm">{authorName}</span>
            <span className="text-text-light text-xs">{formattedDate}</span>
          </div>
          <p className="text-text-secondary text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          {isOwner && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-text-muted hover:text-garnet transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs text-text-muted hover:text-error transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
