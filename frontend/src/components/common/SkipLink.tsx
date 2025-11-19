import type { FC } from 'react';

interface SkipLinkProps {
  targetId?: string;
  children?: string;
}

export const SkipLink: FC<SkipLinkProps> = ({ 
  targetId = 'main-content',
  children = 'Skip to main content'
}) => {
  return (
    <a
      href={`#${targetId}`}
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2
        focus:bg-primary-600 focus:text-white
        focus:rounded-md focus:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
        transition-all
      "
    >
      {children}
    </a>
  );
};
