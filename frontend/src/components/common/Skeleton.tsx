import type { FC } from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-sm',
  card: 'rounded-md',
};

export const Skeleton: FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  className = '',
}) => {
  // Using CSS variables for theme-aware shimmer
  const baseClasses = `
    bg-gradient-to-r from-bg-surface-hover via-bg-surface to-bg-surface-hover
    bg-[length:200%_100%] animate-shimmer
  `;

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  // Default heights for text variant
  if (variant === 'text' && !height) {
    style.height = '1em';
  }

  // For text with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]}`}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width || '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Preset: Pipe Card Skeleton
export const PipeCardSkeleton: FC = () => (
  <div className="bg-bg-surface rounded-md shadow-sm p-4 space-y-3 border border-border-default">
    <div className="flex justify-between items-start">
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="circular" width={24} height={24} />
    </div>
    <Skeleton variant="text" lines={2} />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
    </div>
    <div className="flex items-center gap-4 pt-2">
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="text" width={80} height={16} />
      <Skeleton variant="text" width={60} height={16} />
    </div>
  </div>
);

// Preset: Profile Skeleton
export const ProfileSkeleton: FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={64} height={64} />
      <div className="space-y-2">
        <Skeleton variant="text" width={150} height={24} />
        <Skeleton variant="text" width={100} height={16} />
      </div>
    </div>
    <div className="flex gap-6">
      <Skeleton variant="text" width={80} height={16} />
      <Skeleton variant="text" width={80} height={16} />
      <Skeleton variant="text" width={80} height={16} />
    </div>
  </div>
);
