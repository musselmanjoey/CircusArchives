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
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        disabled={disabled || isSubmitting}
        className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
        rows={3}
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${
            isOverLimit
              ? 'text-red-600 font-medium'
              : remainingChars <= 20
              ? 'text-yellow-600'
              : 'text-gray-500'
          }`}
        >
          {remainingChars}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
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
          >
            {isSubmitting ? 'Posting...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
