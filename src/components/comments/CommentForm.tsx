'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

const MAX_LENGTH = 140;

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  initialValue?: string;
  submitLabel?: string;
  onCancel?: () => void;
  disabled?: boolean;
}

export function CommentForm({
  onSubmit,
  initialValue = '',
  submitLabel = 'Post',
  onCancel,
  disabled = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        disabled={disabled || isSubmitting}
        className="w-full px-4 py-3 border border-border rounded-lg resize-none bg-card text-text placeholder:text-text-light transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-garnet focus:border-transparent disabled:bg-surface disabled:text-text-muted"
        rows={3}
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            isOverLimit
              ? 'text-error'
              : remainingChars <= 20
              ? 'text-warning'
              : 'text-text-muted'
          }`}
        >
          {remainingChars} characters
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isEmpty || isOverLimit || isSubmitting || disabled}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
