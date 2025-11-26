import { type FC, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ReactFlowProvider } from 'reactflow';
import { NavigationBar } from '../../components/common/navigation-bar';
import { EditorToolbar } from './components/EditorToolbar';
import { OperatorsSidebar } from './components/OperatorsSidebar';
import { EditorCanvas } from './components/EditorCanvas';
import { loadDefinition, clearCanvas } from '../../store/slices/canvas-slice';
import { clearAllSchemas } from '../../store/slices/schema-slice';
import { loadPipe } from './logic/saving-logic';
import { autoPreviewSourceOperators } from '../../utils/auto-preview';
import { useToast } from '../../components/common/Toast';
import { EmailVerificationBannerSpacer } from '../../components/common/EmailVerificationBanner';

/**
 * EditorPage - Main layout container for the pipe editor
 * 
 * Layout structure:
 * ┌─────────────────────────────────────────────────────┐
 * │                   Navigation Bar                    │
 * ├─────────────────────────────────────────────────────┤
 * │ [Pipe Title]                [Undo][Redo][Save][Run] │  <- Toolbar
 * ├──────────┬──────────────────────────────────────────┤
 * │ Operators│                                          │
 * │ Sidebar  │              Canvas                      │
 * │          │                                          │
 * └──────────┴──────────────────────────────────────────┘
 */
export const EditorPage: FC = () => {
  const { id: pipeId } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // Guard against double loading in React StrictMode
  const loadedPipeRef = useRef<string | null>(null);

  // Load pipe if pipeId is provided
  useEffect(() => {
    const loadPipeData = async () => {
      if (!pipeId) {
        loadedPipeRef.current = null;
        dispatch(clearCanvas());
        dispatch(clearAllSchemas());
        
        // Auto-preview default source operators after a short delay
        // to ensure the canvas state is updated
        setTimeout(async () => {
          const { store } = await import('../../store/store');
          const nodes = store.getState().canvas.nodes;
          await autoPreviewSourceOperators(nodes);
        }, 100);
        return;
      }

      // Skip if already loaded this pipe (prevents duplicate toasts in StrictMode)
      if (loadedPipeRef.current === pipeId) return;
      loadedPipeRef.current = pipeId;

      setIsLoading(true);
      try {
        const { pipe, nodes, edges } = await loadPipe(pipeId);
        dispatch(clearAllSchemas()); // Clear old schemas before loading new pipe
        dispatch(loadDefinition({ nodes, edges }));
        
        // Auto-preview source operators to populate schemas for field dropdowns
        const previewResult = await autoPreviewSourceOperators(nodes);
        
        addToast({
          type: 'success',
          title: 'Pipe loaded',
          description: previewResult.success > 0 
            ? `Loaded pipe: ${pipe.name} (${previewResult.success} source${previewResult.success > 1 ? 's' : ''} previewed)`
            : `Loaded pipe: ${pipe.name}`,
        });
      } catch (error: any) {
        loadedPipeRef.current = null; // Reset on error so user can retry
        addToast({
          type: 'error',
          title: 'Failed to load pipe',
          description: error.response?.data?.error || 'Please try again',
        });
        dispatch(clearCanvas());
        dispatch(clearAllSchemas());
      } finally {
        setIsLoading(false);
      }
    };

    loadPipeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeId, dispatch]);

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-bg-app">
        {/* Navigation Bar */}
        <NavigationBar />
        
        {/* Spacer for fixed navbar */}
        <div className="h-12 flex-shrink-0" />
        <EmailVerificationBannerSpacer />
        
        {/* Toolbar - Pipe title + controls */}
        <EditorToolbar />
        
        {/* Main content - Sidebar + Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Operators */}
          <OperatorsSidebar />
          
          {/* Canvas area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <EditorCanvas />
          </div>
        </div>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-bg-overlay flex items-center justify-center z-50">
            <div className="text-center bg-bg-surface p-6 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto mb-4"></div>
              <p className="text-sm text-text-secondary">Loading pipe...</p>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
};
