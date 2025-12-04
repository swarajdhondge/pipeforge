import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/common/PageLayout';
import { Button } from '../components/common/Button';

interface ServerErrorPageProps {
  onRetry?: () => void;
}

export const ServerErrorPage: FC<ServerErrorPageProps> = ({ onRetry }) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <PageLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Leaking pipe illustration */}
        <div className="relative mb-8">
          <div className="text-8xl sm:text-9xl font-bold text-status-error-light">
            500
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl sm:text-7xl">💧</div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
          Something went wrong
        </h1>
        
        <p className="text-text-secondary mb-8 max-w-md">
          We're working on fixing this. Please try again in a moment, 
          or head back home.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" onClick={handleRetry}>
            Try Again
          </Button>
          <Link to="/">
            <Button variant="secondary" size="lg">
              Go Home
            </Button>
          </Link>
        </div>

        {/* Decorative leaking pipe visual */}
        <div className="mt-12 flex flex-col items-center">
          <div className="flex items-center gap-1">
            <div className="w-20 h-3 bg-accent-purple rounded-l-full opacity-30"></div>
            <div className="w-6 h-6 bg-accent-purple rounded-full opacity-40 flex items-center justify-center">
              <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse"></div>
            </div>
            <div className="w-20 h-3 bg-accent-blue rounded-r-full opacity-30"></div>
          </div>
          <div className="flex gap-1 mt-1">
            <div className="w-1 h-3 bg-accent-blue rounded-full animate-bounce opacity-20" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-4 bg-accent-blue rounded-full animate-bounce opacity-30" style={{ animationDelay: '100ms' }}></div>
            <div className="w-1 h-2 bg-accent-blue rounded-full animate-bounce opacity-20" style={{ animationDelay: '200ms' }}></div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
