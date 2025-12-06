'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'flex h-11 w-full rounded-lg border bg-card px-4 py-2 text-sm text-text',
            'placeholder:text-text-light',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-garnet focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            error
              ? 'border-error focus:ring-error'
              : 'border-border hover:border-border-strong',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1.5 text-sm text-text-muted">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-error flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: { current: number; max: number };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, charCount, id, ...props }, ref) => {
    const isNearLimit = charCount && charCount.current > charCount.max * 0.9;
    const isOverLimit = charCount && charCount.current > charCount.max;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'flex w-full rounded-lg border bg-card px-4 py-3 text-sm text-text min-h-[100px] resize-y',
            'placeholder:text-text-light',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-garnet focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface',
            error || isOverLimit
              ? 'border-error focus:ring-error'
              : 'border-border hover:border-border-strong',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center mt-1.5">
          <div>
            {hint && !error && (
              <p className="text-sm text-text-muted">{hint}</p>
            )}
            {error && (
              <p className="text-sm text-error flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>
          {charCount && (
            <p className={cn(
              'text-sm',
              isOverLimit ? 'text-error font-medium' : isNearLimit ? 'text-warning' : 'text-text-muted'
            )}>
              {charCount.current}/{charCount.max}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
