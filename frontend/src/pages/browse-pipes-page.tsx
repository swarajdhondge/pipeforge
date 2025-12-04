import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PipeCard } from '../components/pipes/PipeCard';
import { pipeService } from '../services/pipe-service';
import type { Pipe } from '../services/pipe-service';
import { useAuth } from '../hooks/use-auth';
import { PageLayout } from '../components/common/PageLayout';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Checkbox } from '../components/common/Checkbox';
import { PipeCardSkeleton } from '../components/common/Skeleton';
import { NoSearchResultsEmptyState } from '../components/common/EmptyState';

export const BrowsePipesPage: FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'popular');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(searchParams.get('featured') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (showFeaturedOnly) params.set('featured', 'true');
    setSearchParams(params, { replace: true });
  }, [searchQuery, sortBy, showFeaturedOnly, setSearchParams]);

  useEffect(() => {
    const fetchPipes = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let response;
        if (showFeaturedOnly) {
          response = await pipeService.getFeatured(100);
          setPipes(response.data.items);
          setTotal(response.data.items.length);
        } else {
          response = await pipeService.list({
            page,
            limit,
            search: searchQuery || undefined,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
            sort: sortBy as 'popular' | 'recent' | 'most_used',
            is_public: true,
          });
          setPipes(response.data.items);
          setTotal(response.data.total);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load pipes';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPipes();
  }, [searchQuery, selectedTags, sortBy, page, showFeaturedOnly]);


  const handleLike = async (pipeId: string) => {
    if (!isAuthenticated) return;
    
    // Optimistic update - immediately update UI
    const previousPipes = [...pipes];
    setPipes((prev) =>
      prev.map((pipe) =>
        pipe.id === pipeId
          ? { ...pipe, like_count: pipe.like_count + 1, is_liked: true }
          : pipe
      )
    );
    
    try {
      // Sync with server
      const response = await pipeService.like(pipeId);
      // Update with actual server count (in case of race conditions)
      setPipes((prev) =>
        prev.map((pipe) =>
          pipe.id === pipeId
            ? { ...pipe, like_count: response.data.like_count, is_liked: true }
            : pipe
        )
      );
    } catch (err) {
      // Revert on error
      console.error('Failed to like pipe:', err);
      setPipes(previousPipes);
    }
  };

  const handleUnlike = async (pipeId: string) => {
    if (!isAuthenticated) return;
    
    // Optimistic update - immediately update UI
    const previousPipes = [...pipes];
    setPipes((prev) =>
      prev.map((pipe) =>
        pipe.id === pipeId
          ? { ...pipe, like_count: Math.max(0, pipe.like_count - 1), is_liked: false }
          : pipe
      )
    );
    
    try {
      // Sync with server
      const response = await pipeService.unlike(pipeId);
      // Update with actual server count
      setPipes((prev) =>
        prev.map((pipe) =>
          pipe.id === pipeId
            ? { ...pipe, like_count: response.data.like_count, is_liked: false }
            : pipe
        )
      );
    } catch (err) {
      // Revert on error
      console.error('Failed to unlike pipe:', err);
      setPipes(previousPipes);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSortBy('popular');
    setShowFeaturedOnly(false);
    setPage(1);
  };

  const allTags = Array.from(new Set(pipes.flatMap((pipe) => pipe.tags || []))).sort();
  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = searchQuery || selectedTags.length > 0 || showFeaturedOnly;

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'most_used', label: 'Most Used' },
  ];

  return (
    <PageLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Browse Pipes</h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1">
              Discover and reuse community-built data pipelines
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pipes..."
                  isDisabled={showFeaturedOnly}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
              <div className="w-full sm:w-40 md:w-48">
                <Select
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                  isDisabled={showFeaturedOnly}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <Checkbox
                label="⭐ Featured Only"
                checked={showFeaturedOnly}
                onChange={(checked) => {
                  setShowFeaturedOnly(checked);
                  setPage(1);
                }}
              />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <p className="text-xs sm:text-sm font-medium text-text-secondary mb-2">Filter by tags:</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`
                        px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors
                        ${selectedTags.includes(tag)
                          ? 'bg-accent-purple text-text-inverse'
                          : 'bg-bg-surface-hover text-text-secondary hover:bg-bg-surface-active'
                        }
                      `}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>


        {/* Error */}
        {error && (
          <Card className="bg-status-error-light border-status-error">
            <p className="text-status-error">{error}</p>
          </Card>
        )}

        {/* Pipes Grid - Responsive: 1 col mobile, 2 col sm, 3 col lg, 4 col xl */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <PipeCardSkeleton key={i} />
            ))}
          </div>
        ) : pipes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {pipes.map((pipe) => (
                <PipeCard
                  key={pipe.id}
                  pipe={pipe}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  isDisabled={page === 1}
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">←</span>
                </Button>
                <span className="px-2 sm:px-4 py-2 text-sm sm:text-base text-text-secondary">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  isDisabled={page === totalPages}
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">→</span>
                </Button>
              </div>
            )}
          </>
        ) : (
          <NoSearchResultsEmptyState onBrowseAll={clearFilters} />
        )}
      </div>
    </PageLayout>
  );
};
