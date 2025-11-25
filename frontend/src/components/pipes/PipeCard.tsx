import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Card } from '../common/Card';

interface Pipe {
  id: string;
  name: string;
  description: string;
  author?: {
    id: string;
    displayName?: string;
    // Legacy fields for backward compatibility
    email?: string;
    name?: string;
  };
  tags: string[];
  like_count: number;
  execution_count: number;
  is_liked?: boolean;
  is_featured?: boolean;
  created_at: string;
}

interface PipeCardProps {
  pipe: Pipe;
  onLike?: (pipeId: string) => void;
  onUnlike?: (pipeId: string) => void;
}

export const PipeCard: FC<PipeCardProps> = ({ pipe, onLike, onUnlike }) => {
  const { isAuthenticated } = useAuth();

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    
    if (pipe.is_liked) {
      onUnlike?.(pipe.id);
    } else {
      onLike?.(pipe.id);
    }
  };

  // Use displayName (new), fall back to name, then email username for backward compatibility
  const authorName = pipe.author?.displayName || pipe.author?.name || pipe.author?.email?.split('@')[0] || 'Pipe Forge';
  const isSystemTemplate = !pipe.author?.id;

  return (
    <Link to={`/pipes/${pipe.id}`} className="block group">
      <Card 
        variant="interactive" 
        className="h-full flex flex-col transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-text-primary truncate">
                {pipe.name}
              </h3>
              {pipe.is_featured && (
                <span className="px-2 py-0.5 bg-accent-orange-light text-accent-orange text-xs font-medium rounded-full whitespace-nowrap">
                  ⭐ Featured
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLikeClick}
            className={`
              p-1.5 rounded-full transition-colors flex-shrink-0
              ${pipe.is_liked 
                ? 'text-status-error bg-status-error-light hover:brightness-95' 
                : 'text-text-tertiary hover:text-status-error hover:bg-bg-surface-hover'
              }
              ${!isAuthenticated ? 'opacity-50 cursor-default' : ''}
            `}
            title={isAuthenticated ? (pipe.is_liked ? 'Unlike' : 'Like') : 'Sign in to like'}
          >
            <svg className="w-5 h-5" fill={pipe.is_liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>


        {/* Description */}
        <p className="text-sm text-text-secondary mb-3 line-clamp-2 flex-1">
          {pipe.description || 'No description'}
        </p>

        {/* Tags */}
        {pipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-accent-purple-light text-accent-purple text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {pipe.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-bg-surface-hover text-text-tertiary text-xs rounded-full">
                +{pipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border-muted text-sm text-text-tertiary">
          <div className="flex items-center gap-1.5">
            {isSystemTemplate ? (
              <div className="w-5 h-5 rounded-full bg-accent-blue-light flex items-center justify-center text-accent-blue text-xs">
                🔧
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-accent-purple-light flex items-center justify-center text-accent-purple text-xs font-medium">
                {authorName[0].toUpperCase()}
              </div>
            )}
            <span className="truncate max-w-[100px]">{authorName}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="Executions">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{pipe.execution_count}</span>
            </div>
            <div className="flex items-center gap-1" title="Likes">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{pipe.like_count}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
