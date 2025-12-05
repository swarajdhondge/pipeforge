import { useState, useEffect, type FC, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { pipeService } from '../services/pipe-service';
import type { Pipe } from '../services/pipe-service';
import { NavigationBar } from '../components/common/navigation-bar';
import { Footer } from '../components/common/Footer';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PipeCardSkeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/Toast';
import { EmailVerificationBannerSpacer } from '../components/common/EmailVerificationBanner';

// Template card with "Use this template" and "View" buttons
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

  const handleUseTemplate = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
        // For anonymous users, load the template directly in editor
        // The editor will load the pipe and allow local editing
        navigate(`/editor/${pipe.id}`);
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
    <Card 
      variant="interactive" 
      className="flex flex-col h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
      onClick={() => navigate(`/explore/${pipe.id}`, { state: { from: 'templates' } })}
    >
      <div className="p-4 sm:p-5 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-text-primary text-base sm:text-lg line-clamp-1">
            {pipe.name}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${difficultyColors[difficulty.toLowerCase()]}`}>
            {difficulty}
          </span>
        </div>
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {pipe.description}
        </p>
        <div className="flex flex-wrap gap-1 mb-4">
          {pipe.tags.filter(tag => 
            !['beginner', 'intermediate', 'advanced', 'getting-started', 'api-integration', 'rss-feeds', 'data-processing'].includes(tag.toLowerCase())
          ).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-accent-purple-light text-accent-purple-dark text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/explore/${pipe.id}`, { state: { from: 'templates' } });
          }}
        >
          View
        </Button>
        <Button
          onClick={handleUseTemplate}
          isLoading={isLoading}
          className="flex-1"
          size="sm"
        >
          Use Template
        </Button>
      </div>
    </Card>
  );
};

// Category filter button
const CategoryButton: FC<{
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
      ${active 
        ? 'bg-accent-purple text-white border-accent-purple' 
        : 'bg-bg-surface text-text-secondary border-border-default hover:border-accent-purple hover:text-accent-purple'
      }
    `}
  >
    <span>{icon}</span>
    <span className="font-medium">{label}</span>
    <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-bg-surface-hover'}`}>
      {count}
    </span>
  </button>
);

// Difficulty filter button
const DifficultyButton: FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}> = ({ active, onClick, label, color }) => (
  <button
    onClick={onClick}
    className={`
      px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2
      ${active 
        ? `${color} border-current` 
        : 'bg-bg-surface text-text-tertiary border-transparent hover:border-border-default'
      }
    `}
  >
    {label}
  </button>
);

export const TemplatesPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState<Pipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get filters from URL
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedDifficulty = searchParams.get('difficulty') || 'all';

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Fetch featured pipes as templates
        const response = await pipeService.getFeatured(50);
        setTemplates(response.data.items);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);

  // Category definitions matching our seed data
  const categories = [
    { id: 'all', label: 'All Templates', icon: '📋' },
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'data-processing', label: 'Data Processing', icon: '⚙️' },
    { id: 'api-integration', label: 'API Integration', icon: '🔌' },
    { id: 'rss-feeds', label: 'RSS & Feeds', icon: '📡' },
  ];

  const difficulties = [
    { id: 'all', label: 'All Levels' },
    { id: 'beginner', label: '🟢 Beginner', color: 'bg-status-success-light text-status-success-dark' },
    { id: 'intermediate', label: '🟡 Intermediate', color: 'bg-status-warning-light text-status-warning-dark' },
    { id: 'advanced', label: '🔴 Advanced', color: 'bg-status-error-light text-status-error-dark' },
  ];

  // Calculate counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templates.forEach(pipe => {
      pipe.tags.forEach(tag => {
        const lowerTag = tag.toLowerCase();
        if (['getting-started', 'data-processing', 'api-integration', 'rss-feeds'].includes(lowerTag)) {
          counts[lowerTag] = (counts[lowerTag] || 0) + 1;
        }
      });
    });
    return counts;
  }, [templates]);

  // Filter templates based on selected category and difficulty
  const filteredTemplates = useMemo(() => {
    return templates.filter(pipe => {
      // Category filter
      if (selectedCategory !== 'all') {
        const hasCategory = pipe.tags.some(tag => tag.toLowerCase() === selectedCategory);
        if (!hasCategory) return false;
      }
      
      // Difficulty filter
      if (selectedDifficulty !== 'all') {
        const hasDifficulty = pipe.tags.some(tag => tag.toLowerCase() === selectedDifficulty);
        if (!hasDifficulty) return false;
      }
      
      return true;
    });
  }, [templates, selectedCategory, selectedDifficulty]);

  const updateFilter = (type: 'category' | 'difficulty', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(type);
    } else {
      newParams.set(type, value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-app">
      <NavigationBar />
      
      {/* Spacer for fixed navbar */}
      <div className="h-12" />
      <EmailVerificationBannerSpacer />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            🧩 Pipe Templates
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Start building with pre-made pipes. Choose a template, customize it, and make it your own.
          </p>
        </div>

        {/* Category Filters */}
        <section className="mb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <CategoryButton
                key={cat.id}
                active={selectedCategory === cat.id}
                onClick={() => updateFilter('category', cat.id)}
                icon={cat.icon}
                label={cat.label}
                count={categoryCounts[cat.id] || 0}
              />
            ))}
          </div>
        </section>

        {/* Difficulty Filters */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {difficulties.map((diff) => (
              <DifficultyButton
                key={diff.id}
                active={selectedDifficulty === diff.id}
                onClick={() => updateFilter('difficulty', diff.id)}
                label={diff.label}
                color={diff.color || ''}
              />
            ))}
          </div>
        </section>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-secondary">
            Showing <span className="font-semibold text-text-primary">{filteredTemplates.length}</span> templates
            {selectedCategory !== 'all' && (
              <span> in <span className="font-semibold text-accent-purple">{categories.find(c => c.id === selectedCategory)?.label}</span></span>
            )}
            {selectedDifficulty !== 'all' && (
              <span> • <span className="font-semibold">{selectedDifficulty}</span> level</span>
            )}
          </p>
          {(selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="text-sm text-text-link hover:text-accent-purple"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PipeCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((pipe) => (
              <TemplateCard key={pipe.id} pipe={pipe} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-text-tertiary mb-4">
              No templates found with the selected filters.
            </p>
            <Button 
              variant="secondary" 
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              Clear Filters
            </Button>
          </Card>
        )}

        {/* CTA Section */}
        <section className="mt-16 text-center">
          <Card className="p-8 bg-gradient-to-br from-accent-purple to-accent-blue">
            <h2 className="text-2xl font-bold text-white mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Create your own custom pipe from scratch or explore community-created pipes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/editor">
                <Button size="lg" className="bg-white !text-[#4C3575] hover:bg-white/90 font-semibold">
                  Create from Scratch
                </Button>
              </Link>
              <Link to="/explore">
                <Button size="lg" variant="secondary" className="bg-white/20 border-white/40 !text-white hover:bg-white/30 font-semibold">
                  Explore Community
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};
