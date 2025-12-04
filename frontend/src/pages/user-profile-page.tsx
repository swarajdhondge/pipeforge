import { useState, useEffect, type FC } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { pipeService, type Pipe } from '../services/pipe-service';
import { PipeCard } from '../components/pipes/PipeCard';
import { useAuth } from '../hooks/use-auth';
import { VersionHistoryModal } from '../components/pipes/version-history-modal';
import { SecretsList } from '../components/secrets';
import { NavigationBar } from '../components/common/navigation-bar';
import { Footer } from '../components/common/Footer';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { useToast } from '../components/common/Toast';
import { EmailVerificationBannerSpacer } from '../components/common/EmailVerificationBanner';
import { Avatar } from '../components/common/Avatar';

export const UserProfilePage: FC = () => {
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [recentDrafts, setRecentDrafts] = useState<Pipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versionHistoryPipeId, setVersionHistoryPipeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pipes' | 'drafts' | 'liked' | 'secrets'>('pipes');
  const [likedPipes, setLikedPipes] = useState<Pipe[]>([]);
  const [likedLoading, setLikedLoading] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    pipeId: string | null;
    pipeName: string;
    isDraft: boolean;
  }>({ isOpen: false, pipeId: null, pipeName: '', isDraft: false });
  
  // Toast notifications
  const { addToast } = useToast();

  // Use param userId if provided, otherwise use current user's ID
  const userId = userIdParam || user?.id;
  
  // Check if viewing own profile
  const isOwnProfile = userId === user?.id;

  // Fetch liked pipes when tab is selected
  useEffect(() => {
    const fetchLikedPipes = async () => {
      if (activeTab !== 'liked' || !isOwnProfile || likedPipes.length > 0) return;
      
      setLikedLoading(true);
      try {
        // Fetch all public pipes and filter to liked ones
        const response = await pipeService.list({ is_public: true, limit: 100 });
        const liked = response.data.items.filter(pipe => pipe.is_liked);
        setLikedPipes(liked);
      } catch (err) {
        console.error('Failed to fetch liked pipes:', err);
      } finally {
        setLikedLoading(false);
      }
    };
    
    fetchLikedPipes();
  }, [activeTab, isOwnProfile, likedPipes.length]);

  useEffect(() => {
    const fetchUserPipes = async () => {
      if (!userId) {
        setIsLoading(false);
        setError('User not found');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // If viewing own profile, fetch all pipes (public + private)
        // If viewing another user's profile, fetch only public pipes
        const response = await pipeService.list({
          user_id: userId,
          is_public: isOwnProfile ? undefined : true,
          limit: 100,
        });
        
        // IMPORTANT: Filter to ensure we ONLY show pipes that belong to this specific user
        // The backend query returns (user's pipes OR public pipes), but for profile page
        // we only want pipes that belong to THIS user
        const userPipes = response.data.items.filter(pipe => pipe.user_id === userId);
        
        // Separate drafts from published pipes
        const drafts = userPipes.filter(pipe => pipe.is_draft === true);
        const published = userPipes.filter(pipe => pipe.is_draft !== true);
        
        setPipes(published);
        
        // Set recent drafts only for own profile
        if (isOwnProfile) {
          setRecentDrafts(drafts.slice(0, 5)); // Max 5 drafts
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load user pipes');
        console.error('Failed to fetch user pipes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPipes();
  }, [userId, isOwnProfile]);

  const handleLike = async (pipeId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in to like pipes');
      return;
    }

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
      const response = await pipeService.like(pipeId);
      // Update with actual server count
      setPipes((prev) =>
        prev.map((pipe) =>
          pipe.id === pipeId
            ? { ...pipe, like_count: response.data.like_count, is_liked: true }
            : pipe
        )
      );
    } catch (err: any) {
      // Revert on error
      console.error('Failed to like pipe:', err);
      setPipes(previousPipes);
    }
  };

  const handleUnlike = async (pipeId: string) => {
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
      const response = await pipeService.unlike(pipeId);
      // Update with actual server count
      setPipes((prev) =>
        prev.map((pipe) =>
          pipe.id === pipeId
            ? { ...pipe, like_count: response.data.like_count, is_liked: false }
            : pipe
        )
      );
    } catch (err: any) {
      // Revert on error
      console.error('Failed to unlike pipe:', err);
      setPipes(previousPipes);
    }
  };

  // Show delete confirmation dialog for pipe
  const showDeletePipeConfirmation = (pipeId: string, pipeName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      pipeId,
      pipeName,
      isDraft: false,
    });
  };

  // Show delete confirmation dialog for draft
  const showDeleteDraftConfirmation = (draftId: string, draftName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      pipeId: draftId,
      pipeName: draftName || 'Untitled Pipe',
      isDraft: true,
    });
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.pipeId) return;

    try {
      await pipeService.delete(deleteConfirmation.pipeId);
      
      if (deleteConfirmation.isDraft) {
        setRecentDrafts((prev) => prev.filter((draft) => draft.id !== deleteConfirmation.pipeId));
        addToast({
          type: 'success',
          title: 'Draft deleted',
          description: `"${deleteConfirmation.pipeName}" has been deleted.`,
        });
      } else {
        setPipes((prev) => prev.filter((pipe) => pipe.id !== deleteConfirmation.pipeId));
        addToast({
          type: 'success',
          title: 'Pipe deleted',
          description: `"${deleteConfirmation.pipeName}" has been deleted.`,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete failed',
        description: err.response?.data?.error || 'Failed to delete. Please try again.',
      });
    } finally {
      setDeleteConfirmation({ isOpen: false, pipeId: null, pipeName: '', isDraft: false });
    }
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, pipeId: null, pipeName: '', isDraft: false });
  };

  const handlePublishDraft = async (draftId: string, isPublic: boolean) => {
    try {
      const response = await pipeService.update(draftId, {
        is_draft: false,
        is_public: isPublic,
      });

      // Remove from drafts and add to published pipes
      setRecentDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
      setPipes((prev) => [response.data, ...prev]);
      
      alert(`Draft published as ${isPublic ? 'Public' : 'Private'} pipe!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish draft');
    }
  };

  const [publishModalDraftId, setPublishModalDraftId] = useState<string | null>(null);

  const handleToggleVisibility = async (pipeId: string, currentVisibility: boolean) => {
    try {
      const response = await pipeService.update(pipeId, {
        is_public: !currentVisibility,
      });

      setPipes((prev) =>
        prev.map((pipe) =>
          pipe.id === pipeId ? { ...pipe, is_public: response.data.is_public } : pipe
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update visibility');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-app">
        <NavigationBar />
        <div className="h-12" />
        <EmailVerificationBannerSpacer />
        <main id="main-content" className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Profile Header Skeleton */}
            <Card className="mb-8">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circular" width={64} height={64} />
                  <div className="flex-1">
                    <Skeleton variant="text" width={200} height={28} className="mb-2" />
                    <Skeleton variant="text" width={120} height={20} />
                  </div>
                  <Skeleton variant="rectangular" width={140} height={40} className="rounded-lg" />
                </div>
              </div>
            </Card>
            
            {/* Tabs Skeleton */}
            <div className="mb-6 flex gap-8 border-b border-border-default pb-4">
              <Skeleton variant="text" width={60} height={24} />
              <Skeleton variant="text" width={80} height={24} />
            </div>
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="card" height={200} />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-app">
        <NavigationBar />
        <div className="h-12" />
        <EmailVerificationBannerSpacer />
        <main id="main-content" className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="❌"
            title="Failed to load profile"
            description={error}
            action={{
              label: 'Try Again',
              onClick: () => window.location.reload(),
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Use displayName for privacy, fall back to email username
  const userDisplayName = pipes[0]?.author?.displayName || pipes[0]?.author?.name || user?.name || user?.email?.split('@')[0] || 'Unknown User';
  const pageTitle = userDisplayName;
  const pipeCountText = isOwnProfile 
    ? `${pipes.length} ${pipes.length === 1 ? 'pipe' : 'pipes'}` 
    : `${pipes.length} public ${pipes.length === 1 ? 'pipe' : 'pipes'}`;

  return (
    <div className="min-h-screen flex flex-col bg-bg-app">
      <NavigationBar />
      <div className="h-12" />
      <EmailVerificationBannerSpacer />
      <main id="main-content" className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Info - Clean Profile Card */}
          <Card className="mb-8" padding="none">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar - supports uploaded images with initial fallback */}
                  <Avatar 
                    src={user?.avatar_url}
                    name={userDisplayName}
                    alt={userDisplayName}
                    size="2xl"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-text-primary">{pageTitle}</h1>
                    <p className="text-text-secondary">{pipeCountText}</p>
                    {user?.bio && (
                      <p className="text-sm text-text-tertiary mt-1 max-w-md">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
                {isOwnProfile && (
                  <div className="flex gap-2">
                    <Link to="/settings">
                      <Button variant="secondary" size="sm">
                        Edit Profile
                      </Button>
                    </Link>
                    <Link to="/editor">
                      <Button
                        size="sm"
                        leftIcon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        }
                      >
                        Create Pipe
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>

        {/* Error Message */}
        {error && (
          <Card variant="outlined" className="bg-error-light border-error-main mb-6">
            <div className="p-4">
              <p className="text-error-dark">{error}</p>
            </div>
          </Card>
        )}

        {/* Tabs - Only for own profile */}
        {isOwnProfile && (
          <div className="mb-6 border-b border-border-default">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('pipes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'pipes'
                    ? 'border-accent-purple text-accent-purple'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border-default'
                }`}
              >
                My Pipes
                <span className="ml-2 px-2 py-0.5 bg-bg-surface-hover text-text-secondary text-xs rounded-full">
                  {pipes.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'drafts'
                    ? 'border-accent-purple text-accent-purple'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border-default'
                }`}
              >
                Drafts
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  recentDrafts.length >= 5 
                    ? 'bg-status-warning-light text-status-warning-dark dark:bg-status-warning/20 dark:text-status-warning' 
                    : 'bg-bg-surface-hover text-text-secondary'
                }`}>
                  {recentDrafts.length}/5
                </span>
              </button>
              <button
                onClick={() => setActiveTab('liked')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'liked'
                    ? 'border-accent-purple text-accent-purple'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border-default'
                }`}
              >
                Liked
                {likedPipes.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-bg-surface-hover text-text-secondary text-xs rounded-full">
                    {likedPipes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('secrets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'secrets'
                    ? 'border-accent-purple text-accent-purple'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border-default'
                }`}
              >
                API Secrets
              </button>
            </nav>
          </div>
        )}

        {/* Secrets Tab Content */}
        {isOwnProfile && activeTab === 'secrets' && (
          <div className="mb-8">
            <SecretsList />
          </div>
        )}

        {/* Liked Tab Content */}
        {isOwnProfile && activeTab === 'liked' && (
          <div className="mb-8">
            {likedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="card" height={200} />
                ))}
              </div>
            ) : likedPipes.length === 0 ? (
              <EmptyState
                icon="❤️"
                title="No liked pipes yet"
                description="Pipes you like will appear here. Browse public pipes and like the ones you find useful!"
                action={{
                  label: 'Browse Pipes',
                  onClick: () => navigate('/pipes'),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedPipes.map((pipe) => (
                  <PipeCard
                    key={pipe.id}
                    pipe={pipe}
                    onLike={handleLike}
                    onUnlike={(pipeId) => {
                      handleUnlike(pipeId);
                      // Also remove from liked list
                      setLikedPipes(prev => prev.filter(p => p.id !== pipeId));
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drafts Tab Content */}
        {isOwnProfile && activeTab === 'drafts' && (
          <div className="mb-8">
            {recentDrafts.length >= 5 && (
              <Card variant="outlined" className="bg-amber-50 border-amber-200 mb-4">
                <div className="p-4">
                  <p className="text-sm text-amber-800">
                    ⚠️ Draft limit reached (5/5). Delete or publish a draft to create new ones.
                  </p>
                </div>
              </Card>
            )}
            
            {recentDrafts.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No drafts yet"
                description="Save pipes as drafts to work on them later. Drafts are private and only visible to you."
                action={{
                  label: 'Create New Pipe',
                  onClick: () => navigate('/editor'),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDrafts.map((draft) => (
                  <Card
                    key={draft.id}
                    variant="interactive"
                    className="relative group"
                  >
                    <div className="p-4">
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPublishModalDraftId(draft.id);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                          title="Publish draft"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showDeleteDraftConfirmation(draft.id, draft.name);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete draft"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Draft card content - clickable */}
                      <button
                        onClick={() => navigate(`/editor/${draft.id}`)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between mb-2 pr-16">
                          <h3 className="font-medium text-text-primary truncate flex-1">
                            {draft.name || 'Untitled Pipe'}
                          </h3>
                          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full whitespace-nowrap">
                            Draft
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full">
                            {draft.definition?.nodes?.length || 0} operators
                          </span>
                        </div>
                        {draft.description && (
                          <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                            {draft.description}
                          </p>
                        )}
                        <p className="text-xs text-text-tertiary">
                          Updated {new Date(draft.updated_at).toLocaleDateString()}
                        </p>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pipes Section - Show for own profile on pipes tab, or always for other users */}
        {((isOwnProfile && activeTab === 'pipes') || !isOwnProfile) && (
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {isOwnProfile ? 'My Pipes' : 'Public Pipes'}
          </h2>
          {pipes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-text-primary">
                {isOwnProfile ? 'No pipes yet' : 'No public pipes'}
              </h3>
              <p className="mt-1 text-sm text-text-tertiary">
                {isOwnProfile 
                  ? 'Get started by creating your first pipe.' 
                  : "This user hasn't published any public pipes yet."}
              </p>
              {isOwnProfile && (
                <div className="mt-6">
                  <Link
                    to="/editor"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Create Pipe
                  </Link>
                </div>
              )}
            </div>
          ) : isOwnProfile ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {pipes.map((pipe) => (
                  <Card key={pipe.id} variant="interactive" className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        to={`/explore/${pipe.id}`}
                        className="text-base font-medium text-text-link hover:underline flex-1 mr-2"
                      >
                        {pipe.name}
                      </Link>
                      <button
                        onClick={() => handleToggleVisibility(pipe.id, pipe.is_public)}
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                          pipe.is_public
                            ? 'bg-status-success-light text-status-success-dark'
                            : 'bg-bg-surface-hover text-text-secondary'
                        }`}
                      >
                        {pipe.is_public ? '🌐' : '🔒'}
                      </button>
                    </div>
                    
                    {pipe.description && (
                      <p className="text-sm text-text-secondary mb-2 line-clamp-2">{pipe.description}</p>
                    )}
                    
                    {pipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {pipe.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-bg-surface-hover text-text-secondary text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-text-tertiary mb-3">
                      <span>❤️ {pipe.like_count} • ▶️ {pipe.execution_count}</span>
                      <span>{new Date(pipe.updated_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/editor/${pipe.id}`}>
                        <Button size="sm" variant="secondary">Edit</Button>
                      </Link>
                      <Link to={`/explore/${pipe.id}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setVersionHistoryPipeId(pipe.id)}
                      >
                        History
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => showDeletePipeConfirmation(pipe.id, pipe.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-bg-surface rounded-lg shadow overflow-hidden border border-border-default">
                <table className="min-w-full divide-y divide-border-default">
                  <thead className="bg-bg-surface-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Visibility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-bg-surface divide-y divide-border-default">
                    {pipes.map((pipe) => (
                      <tr key={pipe.id} className="hover:bg-bg-surface-hover">
                        <td className="px-6 py-4">
                          <div>
                            <Link
                              to={`/explore/${pipe.id}`}
                              className="text-sm font-medium text-text-link hover:underline"
                            >
                              {pipe.name}
                            </Link>
                            {pipe.description && (
                              <p className="text-sm text-text-tertiary mt-1">{pipe.description}</p>
                            )}
                            {pipe.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {pipe.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-bg-surface-hover text-text-secondary text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleVisibility(pipe.id, pipe.is_public)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              pipe.is_public
                                ? 'bg-status-success-light text-status-success-dark dark:bg-status-success/20 dark:text-status-success'
                                : 'bg-bg-surface-hover text-text-secondary'
                            }`}
                            title={`Click to make ${pipe.is_public ? 'private' : 'public'}`}
                          >
                            {pipe.is_public ? '🌐 Public' : '🔒 Private'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          <div className="flex flex-col gap-1">
                            <span>{pipe.like_count} likes</span>
                            <span>{pipe.execution_count} executions</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {new Date(pipe.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/editor/${pipe.id}`}
                              className="text-text-link hover:text-accent-purple"
                            >
                              Edit
                            </Link>
                            <Link
                              to={`/explore/${pipe.id}`}
                              className="text-text-secondary hover:text-text-primary"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => setVersionHistoryPipeId(pipe.id)}
                              className="text-accent-purple hover:text-accent-purple-dark"
                            >
                              History
                            </button>
                            <button
                              onClick={() => showDeletePipeConfirmation(pipe.id, pipe.name)}
                              className="text-status-error hover:text-status-error-dark"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            // Card view for other users' profiles
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pipes.map((pipe) => (
                <PipeCard
                  key={pipe.id}
                  pipe={pipe}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                />
              ))}
            </div>
          )}
        </div>
        )}

        {/* Version History Modal - Only for own profile */}
        {isOwnProfile && versionHistoryPipeId && (
          <VersionHistoryModal
            pipeId={versionHistoryPipeId}
            isOpen={!!versionHistoryPipeId}
            onClose={() => setVersionHistoryPipeId(null)}
            onRestore={() => {
              window.location.reload();
            }}
          />
        )}

        {/* Publish Draft Modal */}
        {publishModalDraftId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-bg-surface rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-border-default">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Publish Draft
              </h3>
              <p className="text-text-secondary mb-6">
                Choose the visibility for your pipe:
              </p>
              <div className="flex flex-col gap-3 mb-6">
                <button
                  onClick={() => {
                    handlePublishDraft(publishModalDraftId, true);
                    setPublishModalDraftId(null);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Publish as Public
                  <span className="text-xs opacity-90">(Visible to everyone)</span>
                </button>
                <button
                  onClick={() => {
                    handlePublishDraft(publishModalDraftId, false);
                    setPublishModalDraftId(null);
                  }}
                  className="w-full px-4 py-3 bg-bg-surface-active text-text-primary rounded-md font-medium hover:opacity-90 flex items-center justify-center gap-2 border border-border-default"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Publish as Private
                  <span className="text-xs opacity-90">(Only visible to you)</span>
                </button>
              </div>
              <button
                onClick={() => setPublishModalDraftId(null)}
                className="w-full px-4 py-2 bg-bg-surface text-text-secondary border border-border-default rounded-md font-medium hover:bg-bg-surface-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteConfirmation.isOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title={deleteConfirmation.isDraft ? 'Delete Draft' : 'Delete Pipe'}
          message={
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <span className="font-semibold">"{deleteConfirmation.pipeName}"</span>? 
              This action cannot be undone.
            </p>
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
        />
        </div>
      </main>
      <Footer />
    </div>
  );
};
