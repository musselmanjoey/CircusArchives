import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'featured';
  hoverable?: boolean;
}

export function Card({ className, children, variant = 'default', hoverable = false, ...props }: CardProps) {
  const variants = {
    default: 'border border-border bg-card shadow-sm',
    elevated: 'bg-card shadow-md',
    outlined: 'border-2 border-border bg-transparent',
    featured: 'border-2 border-gold bg-spotlight shadow-md',
  };

  return (
    <div
      className={cn(
        'rounded-xl',
        variants[variant],
        hoverable && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: Omit<CardProps, 'variant' | 'hoverable'>) {
  return (
    <div className={cn('px-5 py-4 sm:px-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: Omit<CardProps, 'variant' | 'hoverable'>) {
  return (
    <h3 className={cn('text-lg font-semibold text-text', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: Omit<CardProps, 'variant' | 'hoverable'>) {
  return (
    <p className={cn('text-sm text-text-muted mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: Omit<CardProps, 'variant' | 'hoverable'>) {
  return (
    <div className={cn('px-5 py-4 sm:px-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: Omit<CardProps, 'variant' | 'hoverable'>) {
  return (
    <div className={cn('px-5 py-4 sm:px-6 border-t border-border bg-surface/50 rounded-b-xl', className)} {...props}>
      {children}
    </div>
  );
}

export function CardImage({ src, alt, className, overlay, badge }: {
  src: string;
  alt: string;
  className?: string;
  overlay?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className={cn('relative aspect-video overflow-hidden rounded-t-xl', className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          {overlay}
        </div>
      )}
      {badge && (
        <div className="absolute top-3 left-3">
          {badge}
        </div>
      )}
    </div>
  );
}
