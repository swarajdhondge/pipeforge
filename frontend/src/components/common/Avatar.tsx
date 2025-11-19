import { type FC, useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-24 h-24 text-4xl',
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getColorFromName = (name: string): string => {
  // Generate a consistent color based on the name
  const colors = [
    'from-primary-500 to-secondary-500',
    'from-secondary-500 to-accent-500',
    'from-accent-500 to-primary-500',
    'from-green-500 to-secondary-500',
    'from-primary-600 to-primary-400',
    'from-secondary-600 to-secondary-400',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;
  
  const initials = getInitials(name || alt || '');
  const gradientColor = getColorFromName(name || alt || 'default');

  if (showFallback) {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-br ${gradientColor}
          rounded-full flex items-center justify-center
          text-white font-semibold
          border-2 border-white shadow-md
          ${className}
        `}
        role="img"
        aria-label={alt || name || 'User avatar'}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name || 'User avatar'}
      loading="lazy"
      onError={() => setImageError(true)}
      className={`
        ${sizeClasses[size]}
        rounded-full object-cover
        border-2 border-white shadow-md
        ${className}
      `}
    />
  );
};
