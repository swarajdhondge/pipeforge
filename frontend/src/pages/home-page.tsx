import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { pipeService } from '../services/pipe-service';
import type { Pipe } from '../services/pipe-service';
import { PipeCard } from '../components/pipes/PipeCard';
import { NavigationBar } from '../components/common/navigation-bar';
import { Footer } from '../components/common/Footer';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PipeCardSkeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/Toast';
import { EmailVerificationBannerSpacer } from '../components/common/EmailVerificationBanner';

// Template card with "Use this template" button
const TemplateCard: FC<{ pipe: Pipe }> = ({ pipe }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get difficulty from tags
  const difficulty = pipe.tags.find(tag => 
    ['beginner', 'intermediate', 'advanced'].includes(tag.toLowerCase())
  ) || 'beginner';

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-status-success-light text-status-success-dark',
    intermediate: 'bg-status-warning-light text-status-warning-dark',
    advanced: 'bg-status-error-light text-status-error-dark',
  };

  const handleUseTemplate = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Fork the pipe as a draft
        const response = await pipeService.fork(pipe.id);
        addToast({
          type: 'success',
          title: 'Template copied!',
          description: 'Opening in editor...',
        });
        navigate(`/editor/${response.data.id}`);
      } else {
        // For anonymous users, open the pipe in editor (they can save locally)
        navigate(`/editor?template=${pipe.id}`);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to use template',
        description: err.response?.data?.error || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="interactive" className="flex flex-col h-full">
      <div className="p-4 sm:p-5 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-text-primary text-base sm:text-lg line-clamp-1">
            {pipe.name}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${difficultyColors[difficulty.toLowerCase()]}`}>
            {difficulty}
          </span>
        </div>
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {pipe.description}
        </p>
        <div className="flex flex-wrap gap-1 mb-4">
          {pipe.tags.filter(tag => !['beginner', 'intermediate', 'advanced'].includes(tag.toLowerCase())).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-bg-surface-hover text-text-secondary text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
        <Button
          onClick={handleUseTemplate}
          isLoading={isLoading}
          className="w-full"
          size="sm"
        >
          Use this template
        </Button>
      </div>
    </Card>
  );
};

export const HomePage: FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [trendingPipes, setTrendingPipes] = useState<Pipe[]>([]);
  const [templatePipes, setTemplatePipes] = useState<Pipe[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await pipeService.getTrending(4);
        setTrendingPipes(response.data.items);
      } catch (err) {
        console.error('Failed to fetch trending pipes:', err);
      } finally {
        setIsLoadingTrending(false);
      }
    };
    
    const fetchTemplates = async () => {
      try {
        const response = await pipeService.getFeatured(3);
        setTemplatePipes(response.data.items);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    
    fetchTrending();
    fetchTemplates();
  }, []);

  const handleLike = async (pipeId: string) => {
    if (!isAuthenticated) return;
    try {
      const response = await pipeService.like(pipeId);
      setTrendingPipes((prev) =>
        prev.map((pipe) =>
          pipe.id === pipeId
            ? { ...pipe, like_count: response.data.like_count, is_liked: true }
            : pipe
        )
      );
    } catch (err) {
      console.error('Failed to like pipe:', err);
    }
  };

  const handleUnlike = async (pipeId: string) => {
    try {
      const response = await pipeService.unlike(pipeId);
      setTrendingPipes((prev) =>
        prev.map((pipe) =>
          pipe.id === pipeId
            ? { ...pipe, like_count: response.data.like_count, is_liked: false }
            : pipe
        )
      );
    } catch (err) {
      console.error('Failed to unlike pipe:', err);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-bg-app">
      <NavigationBar />
      
      {/* Spacer for fixed navbar */}
      <div className="h-12" />
      <EmailVerificationBannerSpacer />

      {/* Hero Section */}
      <section className="bg-pipe-forge py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/80 text-xs sm:text-sm font-medium uppercase tracking-wider mb-3 sm:mb-4">
            The beloved tool is back
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            Welcome to Pipe Forge
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 px-4">
            The visual data mashup tool you loved, rebuilt for 2025. Connect APIs, transform data, automate workflows.
          </p>

          {isAuthenticated && user && (
            <p className="text-white/80 mb-4 sm:mb-6 text-sm sm:text-base">
              Welcome back, {(user as any)?.display_name || (user as any)?.username || user.email?.split('@')[0]}!
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/editor" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto sm:min-w-[180px]">
                {isAuthenticated ? 'Create Pipe' : 'Try it Free'}
              </Button>
            </Link>
            <Link to="/explore" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto sm:min-w-[180px] bg-white/10 border-white/30 text-white hover:bg-white/20">
                Explore Pipes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-text-primary mb-8 sm:mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '1',
                title: 'Connect',
                description: 'Fetch data from any API or data source using the Fetch operator',
                icon: '🌐',
              },
              {
                step: '2',
                title: 'Transform',
                description: 'Filter, sort, and transform your data with powerful operators',
                icon: '⚡',
              },
              {
                step: '3',
                title: 'Output',
                description: 'Get clean JSON results ready to use in your applications',
                icon: '📤',
              },
            ].map((item) => (
              <Card key={item.step} variant="outlined" className="text-center p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{item.icon}</div>
                <div className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent-purple-light text-accent-purple font-bold text-xs sm:text-sm mb-2 sm:mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-text-secondary">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Templates Section */}
      <section className="py-12 sm:py-16 bg-bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">📋 Start with a Template</h2>
              <p className="text-text-secondary mt-1">Learn by example with these pre-built pipes</p>
            </div>
            <Link to="/templates" className="text-sm sm:text-base text-text-link hover:text-accent-purple font-medium">
              View all templates →
            </Link>
          </div>

          {isLoadingTemplates ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <PipeCardSkeleton key={i} />
              ))}
            </div>
          ) : templatePipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {templatePipes.map((pipe) => (
                <TemplateCard key={pipe.id} pipe={pipe} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-text-tertiary mb-4">Browse our collection of ready-to-use templates</p>
              <Link to="/templates">
                <Button>Explore Templates</Button>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Featured/Trending Pipes */}
      <section className="py-12 sm:py-16 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">🔥 Trending Pipes</h2>
            <Link to="/explore" className="text-sm sm:text-base text-text-link hover:text-accent-purple font-medium">
              Browse all →
            </Link>
          </div>

          {isLoadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <PipeCardSkeleton key={i} />
              ))}
            </div>
          ) : trendingPipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {trendingPipes.map((pipe) => (
                <PipeCard
                  key={pipe.id}
                  pipe={pipe}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-text-tertiary">No trending pipes yet. Be the first to create one!</p>
              <Link to="/editor" className="mt-4 inline-block">
                <Button>Create Pipe</Button>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-text-primary mb-8 sm:mb-12">
            Why Pipe Forge?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: 'Visual Editor',
                description: 'Drag and drop operators to build data pipelines visually. No coding required.',
                icon: '🎨',
              },
              {
                title: 'Try Before Signup',
                description: 'Create and execute pipes without an account. 5 free executions to get started.',
                icon: '🚀',
              },
              {
                title: 'Share & Reuse',
                description: 'Share your pipes publicly or copy others\' pipes to learn and build faster.',
                icon: '🔀',
              },
            ].map((feature) => (
              <Card key={feature.title} variant="elevated" className="text-center p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-text-secondary">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Sources Section */}
      <section className="py-12 sm:py-16 bg-bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
            Works with your favorite platforms
          </h2>
          <p className="text-text-secondary mb-8">
            Just paste any URL - we auto-detect and convert it!
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              { name: 'Reddit', emoji: '📱' },
              { name: 'Medium', emoji: '✍️' },
              { name: 'GitHub', emoji: '🐙' },
              { name: 'DEV.to', emoji: '💻' },
              { name: 'Wikipedia', emoji: '📚' },
              { name: 'Hacker News', emoji: '🔶' },
              { name: 'RSS Feeds', emoji: '📡' },
              { name: 'Any JSON API', emoji: '🔗' },
            ].map((source) => (
              <div 
                key={source.name} 
                className="flex items-center gap-2 px-4 py-2 bg-bg-surface rounded-full shadow-sm border border-border-default"
              >
                <span className="text-xl">{source.emoji}</span>
                <span className="text-sm font-medium text-text-primary">{source.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-pipe-forge">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to build your first pipe?
          </h2>
          <p className="text-sm sm:text-base text-white/80 mb-6 sm:mb-8">
            Join developers using Pipe Forge to automate their data workflows.
          </p>
          <Link to="/editor">
            <Button size="lg" className="bg-white !text-[#4C3575] hover:bg-white/90 font-semibold">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
