import { useState, useEffect, useMemo, type FC } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import ReactFlow, { Background, Controls, BackgroundVariant, type NodeTypes, type EdgeTypes } from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '../hooks/use-auth';
import { pipeService, type Pipe } from '../services/pipe-service';
import { OperatorNode } from '../components/editor/OperatorNode';
import { UnknownOperatorNode } from '../components/editor/UnknownOperatorNode';
import { SelectableEdge } from '../components/editor/SelectableEdge';
import { PageLayout } from '../components/common/PageLayout';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';
import { Tooltip } from '../components/common/Tooltip';
import { useToast } from '../components/common/Toast';
import { ShareMenu } from '../components/common/ShareMenu';
import { KNOWN_OPERATOR_TYPES } from '../types/operator.types';

// Define node types outside component to avoid ReactFlow warnings
const nodeTypes: NodeTypes = {
  // Legacy operators
  fetch: OperatorNode,
  filter: OperatorNode,
  sort: OperatorNode,
  transform: OperatorNode,
  // Source operators
  'fetch-json': OperatorNode,
  'fetch-csv': OperatorNode,
  'fetch-rss': OperatorNode,
  'fetch-page': OperatorNode,
  // User input operators
  'text-input': OperatorNode,
  'number-input': OperatorNode,
  'url-input': OperatorNode,
  'date-input': OperatorNode,
  // Transform operators
  unique: OperatorNode,
  truncate: OperatorNode,
  tail: OperatorNode,
  rename: OperatorNode,
  // String operators
  'string-replace': OperatorNode,
  regex: OperatorNode,
  substring: OperatorNode,
  // URL operators
  'url-builder': OperatorNode,
  // Special operators
  'pipe-output': OperatorNode,
  // Unknown operator placeholder (Requirement 19.5)
  'unknown-operator': UnknownOperatorNode,
};

// Define edge types for custom arrows
const edgeTypes: EdgeTypes = {
  selectable: SelectableEdge,
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PipeDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const [pipe, setPipe] = useState<Pipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determine back link based on where user came from
  const fromTemplates = location.state?.from === 'templates' || document.referrer.includes('/templates');
  const backLink = fromTemplates ? '/templates' : '/explore';
  const backLabel = fromTemplates ? 'Back to Templates' : 'Back to Explore';

  // Process nodes to handle unknown operator types (Requirement 19.5)
  const processedNodes = useMemo(() => {
    if (!pipe?.definition?.nodes) return [];
    
    return pipe.definition.nodes.map((node: any) => {
      if (!KNOWN_OPERATOR_TYPES.has(node.type)) {
        // Unknown operator type - convert to placeholder
        console.warn(`Unknown operator type: ${node.type}`);
        return {
          ...node,
          type: 'unknown-operator',
          data: {
            ...node.data,
            type: node.type, // Store original type for reference
          },
        };
      }
      return node;
    });
  }, [pipe?.definition?.nodes]);

  useEffect(() => {
    const fetchPipe = async () => {
      if (!id) return;
      
      // Validate UUID format client-side
      if (!UUID_REGEX.test(id)) {
        setError('Invalid pipe ID');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await pipeService.get(id);
        setPipe(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load pipe');
        console.error('Failed to fetch pipe:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipe();
  }, [id]);

  const handleCopy = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!id) return;
    
    try {
      const response = await pipeService.fork(id);
      addToast({
        type: 'success',
        title: 'Pipe copied!',
        description: 'You can now edit your copy of this pipe.',
      });
      navigate(`/editor/${response.data.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy pipe';
      addToast({
        type: 'error',
        title: 'Copy failed',
        description: errorMessage,
      });
    }
  };

  const handleExecute = () => {
    navigate(`/editor/${id}`);
  };

  const handleEdit = () => {
    navigate(`/editor/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this pipe?')) return;
    
    if (!id) return;
    
    try {
      await pipeService.delete(id);
      addToast({
        type: 'success',
        title: 'Pipe deleted',
        description: 'The pipe has been permanently deleted.',
      });
      navigate('/pipes');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pipe';
      addToast({
        type: 'error',
        title: 'Delete failed',
        description: errorMessage,
      });
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      addToast({
        type: 'info',
        title: 'Sign in required',
        description: 'Please sign in to like pipes.',
      });
      return;
    }
    
    if (!id || !pipe) return;
    
    // Optimistic update - immediately update UI
    const previousPipe = { ...pipe };
    setPipe({ ...pipe, like_count: pipe.like_count + 1, is_liked: true });
    
    try {
      const response = await pipeService.like(id);
      // Update with actual server count
      setPipe((current) => current ? { ...current, like_count: response.data.like_count, is_liked: true } : current);
    } catch (err: unknown) {
      // Revert on error
      setPipe(previousPipe);
      const errorMessage = err instanceof Error ? err.message : 'Failed to like pipe';
      addToast({
        type: 'error',
        title: 'Like failed',
        description: errorMessage,
      });
    }
  };

  const handleUnlike = async () => {
    if (!id || !pipe) return;
    
    // Optimistic update - immediately update UI
    const previousPipe = { ...pipe };
    setPipe({ ...pipe, like_count: Math.max(0, pipe.like_count - 1), is_liked: false });
    
    try {
      const response = await pipeService.unlike(id);
      // Update with actual server count
      setPipe((current) => current ? { ...current, like_count: response.data.like_count, is_liked: false } : current);
    } catch (err: unknown) {
      // Revert on error
      setPipe(previousPipe);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlike pipe';
      addToast({
        type: 'error',
        title: 'Unlike failed',
        description: errorMessage,
      });
    }
  };

  const isOwner = user && pipe && user.id === pipe.user_id;

  // Loading skeleton
  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          {/* Back link skeleton */}
          <Skeleton variant="text" width={120} />
          
          {/* Header card skeleton */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="text" width={200} height={32} />
                  <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
                </div>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
                <div className="flex gap-2">
                  <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
                  <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton variant="rectangular" width={100} height={40} className="rounded" />
                <Skeleton variant="rectangular" width={80} height={40} className="rounded" />
              </div>
            </div>
          </Card>
          
          {/* Preview skeleton */}
          <Card className="p-4 sm:p-6">
            <Skeleton variant="text" width={150} height={24} className="mb-4" />
            <Skeleton variant="rectangular" height={384} className="rounded" />
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (error || !pipe) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {error || 'Pipe not found'}
          </h1>
          <p className="text-text-secondary mb-6">
            This pipe may have been deleted or the URL might be incorrect.
          </p>
          <div className="flex gap-3">
            <Link to="/explore">
              <Button variant="primary">Explore Pipes</Button>
            </Link>
            <Link to="/">
              <Button variant="secondary">Go Home</Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Use displayName (new), fall back to name, then email username for backward compatibility
  const authorName = pipe.author?.displayName || pipe.author?.name || pipe.author?.email?.split('@')[0] || 'Unknown';
  const formattedDate = new Date(pipe.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const updatedDate = pipe.updated_at ? new Date(pipe.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : null;

  return (
    <PageLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Back link - context-aware based on where user came from */}
        <Link 
          to={backLink} 
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent-purple transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>

        {/* Header Card */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
            {/* Left: Info */}
            <div className="flex-1 min-w-0">
              {/* Title and badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary break-words">
                  {pipe.name}
                </h1>
                <span className={`
                  px-2 py-0.5 text-xs font-medium rounded-full
                  ${pipe.is_public 
                    ? 'bg-status-success-light text-status-success-dark' 
                    : 'bg-bg-surface-secondary text-text-secondary'
                  }
                `}>
                  {pipe.is_public ? '🌐 Public' : '🔒 Private'}
                </span>
                {pipe.is_featured && (
                  <span className="px-2 py-0.5 bg-accent-orange-light text-accent-orange-dark text-xs font-medium rounded-full">
                    ⭐ Featured
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-text-secondary mb-4">
                {pipe.description || 'No description provided'}
              </p>

              {/* Author and dates */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-tertiary mb-4">
                <Link 
                  to={`/profile/${pipe.user_id}`}
                  className="flex items-center gap-1.5 hover:text-accent-purple transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent-purple-light flex items-center justify-center text-accent-purple text-xs font-medium">
                    {authorName[0].toUpperCase()}
                  </div>
                  <span>{authorName}</span>
                </Link>
                <span className="hidden sm:inline">•</span>
                <span>Created {formattedDate}</span>
                {updatedDate && updatedDate !== formattedDate && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Updated {updatedDate}</span>
                  </>
                )}
              </div>

              {/* Tags */}
              {pipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                  {pipe.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      to={`/pipes?search=${encodeURIComponent(tag)}`}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 bg-accent-purple-light text-accent-purple-dark text-xs sm:text-sm rounded-full hover:bg-accent-purple-muted transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-text-secondary">
                <button
                  onClick={pipe.is_liked ? handleUnlike : handleLike}
                  disabled={!isAuthenticated}
                  className={`
                    flex items-center gap-1.5 transition-colors
                    ${pipe.is_liked ? 'text-status-error' : 'hover:text-status-error'}
                    ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title={isAuthenticated ? (pipe.is_liked ? 'Unlike' : 'Like') : 'Sign in to like'}
                >
                  <svg
                    className="w-5 h-5"
                    fill={pipe.is_liked ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{pipe.like_count} likes</span>
                </button>
                <div className="flex items-center gap-1.5" title="Executions">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{pipe.execution_count} runs</span>
                </div>
                {(pipe as { fork_count?: number }).fork_count !== undefined && (pipe as { fork_count?: number }).fork_count! > 0 && (
                  <div className="flex items-center gap-1.5" title="Copies">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{(pipe as { fork_count?: number }).fork_count} copies</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap lg:flex-col gap-2 sm:gap-3">
              <Button onClick={handleExecute} className="flex-1 lg:flex-none">
                ▶ Run Pipe
              </Button>
              
              {isAuthenticated && !isOwner && (
                <Tooltip content="Create your own copy of this pipe">
                  <Button variant="secondary" onClick={handleCopy} className="flex-1 lg:flex-none">
                    📋 Copy Pipe
                  </Button>
                </Tooltip>
              )}
              
              {!isAuthenticated && !isOwner && (
                <Link to="/login" className="flex-1 lg:flex-none">
                  <Button variant="secondary" className="w-full">
                    Sign in to Copy
                  </Button>
                </Link>
              )}
              
              {/* Social media share menu (Task 4) */}
              <ShareMenu 
                url={window.location.href} 
                title={pipe.name} 
                description={pipe.description}
              />
              
              {isOwner && (
                <>
                  <Button variant="secondary" onClick={handleEdit} className="flex-1 lg:flex-none">
                    ✏️ Edit
                  </Button>
                  <Button variant="danger" onClick={handleDelete} className="flex-1 lg:flex-none">
                    🗑️ Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Pipe Preview */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4">
            Pipe Structure
          </h2>
          <div className="h-64 sm:h-80 md:h-96 border border-border-default rounded-lg overflow-hidden bg-bg-canvas">
            <ReactFlow
              nodes={processedNodes}
              edges={pipe.definition.edges.map((edge: any) => ({ ...edge, type: 'selectable' }))}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              {/* Global SVG defs for edge arrow markers */}
              <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                  <marker id="arrow-default" viewBox="0 0 12 12" refX="10" refY="6" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="var(--accent-blue)" />
                  </marker>
                  <marker id="arrow-selected" viewBox="0 0 12 12" refX="10" refY="6" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="var(--accent-orange)" />
                  </marker>
                  <marker id="arrow-hover" viewBox="0 0 12 12" refX="10" refY="6" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M 0 0 L 12 6 L 0 12 L 3 6 Z" fill="var(--accent-purple)" />
                  </marker>
                </defs>
              </svg>
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--canvas-grid-color)" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </Card>

        {/* By the same author section */}
        {pipe.author && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
                More by {authorName}
              </h2>
              <Link 
                to={`/users/${pipe.user_id}`}
                className="text-sm text-text-link hover:text-accent-purple"
              >
                View profile →
              </Link>
            </div>
            <p className="text-sm text-text-tertiary">
              Check out other pipes created by this author.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
