'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center rounded-lg font-medium',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-garnet focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'btn-press'
    );

    const variants = {
      primary: cn(
        'bg-garnet text-white',
        'hover:bg-garnet-dark',
        'shadow-sm hover:shadow-md'
      ),
      secondary: cn(
        'bg-surface text-text-secondary',
        'hover:bg-border hover:text-text',
        'border border-border'
      ),
      outline: cn(
        'border-2 border-garnet text-garnet bg-transparent',
        'hover:bg-garnet hover:text-white'
      ),
      ghost: cn(
        'text-text-secondary bg-transparent',
        'hover:bg-surface hover:text-garnet'
      ),
      gold: cn(
        'bg-gold text-garnet-dark font-semibold',
        'hover:bg-gold-dark',
        'shadow-sm hover:shadow-md'
      ),
      danger: cn(
        'bg-error text-white',
        'hover:bg-red-700',
        'shadow-sm hover:shadow-md'
      ),
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
