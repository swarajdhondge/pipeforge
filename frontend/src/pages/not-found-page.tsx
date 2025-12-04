import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/common/PageLayout';
import { Button } from '../components/common/Button';

export const NotFoundPage: FC = () => {
  return (
    <PageLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Broken pipe illustration */}
        <div className="relative mb-8">
          <div className="text-8xl sm:text-9xl font-bold text-accent-purple-light">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl sm:text-7xl">🔧</div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
          This pipe doesn't exist
        </h1>
        
        <p className="text-text-secondary mb-8 max-w-md">
          It may have been deleted, or the URL might be incorrect. 
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/">
            <Button size="lg">
              Go Home
            </Button>
          </Link>
          <Link to="/pipes">
            <Button variant="secondary" size="lg">
              Browse Pipes
            </Button>
          </Link>
          <Link to="/editor">
            <Button variant="ghost" size="lg">
              Create Pipe
            </Button>
          </Link>
        </div>

        {/* Decorative broken pipe visual */}
        <div className="mt-12 flex items-center gap-2 text-border-strong">
          <div className="w-16 h-3 bg-accent-purple-light rounded-l-full"></div>
          <div className="w-4 h-4 border-2 border-dashed border-border-strong rounded-full"></div>
          <div className="w-16 h-3 bg-accent-blue-light rounded-r-full"></div>
        </div>
      </div>
    </PageLayout>
  );
};
