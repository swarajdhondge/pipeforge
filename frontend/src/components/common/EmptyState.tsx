import type { FC, ReactNode } from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-accent-purple mb-4" style={{ fontSize: '64px' }}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-md mb-6">{description}</p>
      <div className="flex items-center gap-3">
        {action && (
          <Button variant={action.variant || 'primary'} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

// Preset Icons
const PipeIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// Preset Empty States
export const NoPipesEmptyState: FC<{ onCreatePipe: () => void }> = ({ onCreatePipe }) => (
  <EmptyState
    icon={<PipeIcon />}
    title="No pipes yet"
    description="Create your first pipe to get started with data transformation"
    action={{ label: 'Create Pipe', onClick: onCreatePipe }}
  />
);

export const NoSearchResultsEmptyState: FC<{ onBrowseAll: () => void }> = ({ onBrowseAll }) => (
  <EmptyState
    icon={<SearchIcon />}
    title="No pipes found"
    description="Try different keywords or browse all pipes"
    action={{ label: 'Browse All Pipes', onClick: onBrowseAll, variant: 'secondary' }}
  />
);

export const NoExecutionsEmptyState: FC = () => (
  <EmptyState
    icon={<PlayIcon />}
    title="No executions yet"
    description="Run a pipe to see execution history here"
  />
);

export const NoSecretsEmptyState: FC<{ onAddSecret: () => void }> = ({ onAddSecret }) => (
  <EmptyState
    icon={<LockIcon />}
    title="No secrets stored"
    description="Store API keys and tokens securely to use in your pipes"
    action={{ label: 'Add Secret', onClick: onAddSecret }}
  />
);
