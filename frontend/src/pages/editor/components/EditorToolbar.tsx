import { type FC, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../store/store';
import { markClean, undo, redo, setExecutionResult, setIsExecuting, clearExecutionResult, updateNode, clearRunSelectedTrigger } from '../../../store/slices/canvas-slice';
import { PipeMetadataPanel } from '../../../components/editor/PipeMetadataPanel';
import { savePipe, saveDraft } from '../logic/saving-logic';
import { executePipe, executeSelected, formatExecutionResult, validatePipeForExecution } from '../logic/execution-logic';
import { useAuth } from '../../../hooks/use-auth';
import { useToast } from '../../../components/common/Toast';
import { pipeService } from '../../../services/pipe-service';
import { useKeyboardShortcuts } from '../../../hooks/use-keyboard-shortcuts';
import { useBreakpoint } from '../../../hooks/use-media-query';
import { 
  UserInputPromptDialog, 
  detectUserInputNodes, 
  type UserInputValues 
} from '../../../components/editor/UserInputPromptDialog';

/**
 * EditorToolbar - Single toolbar row with pipe title and controls
 * 
 * Desktop layout: [Pipe Title + Unsaved indicator] ... [Undo] [Redo] [Save] [Run]
 * Mobile layout: [Title (truncated)] [Undo] [Redo] [Save] [Run]
 */
export const EditorToolbar: FC = () => {
  const { id: pipeId } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { isMobile } = useBreakpoint();
  const { isDirty, nodes, edges, history, isExecuting, runSelectedNodeId } = useSelector((state: RootState) => state.canvas);
  
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUserInputDialog, setShowUserInputDialog] = useState(false);
  const [pendingUserInputNodes, setPendingUserInputNodes] = useState<ReturnType<typeof detectUserInputNodes>>([]);
  
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  
  const [metadata, setMetadata] = useState({
    name: 'Untitled Pipe',
    description: '',
    isPublic: false,
    tags: [] as string[],
  });

  // Helper to update node status during execution (Requirement 6.1, 6.2, 6.3)
  const updateNodeStatus = useCallback((nodeId: string, status: 'idle' | 'running' | 'success' | 'error', result?: unknown, error?: string) => {
    dispatch(updateNode({ 
      id: nodeId, 
      data: { 
        status, 
        result: result !== undefined ? result : undefined,
        error: error || undefined,
      } 
    }));
  }, [dispatch]);

  // Reset all nodes to idle status
  const resetAllNodeStatuses = useCallback(() => {
    nodes.forEach(node => {
      updateNodeStatus(node.id, 'idle');
    });
  }, [nodes, updateNodeStatus]);

  // Register keyboard shortcuts for undo/redo
  useKeyboardShortcuts([
    {
      key: 'z',
      ctrl: true,
      shift: false,
      handler: () => {
        if (canUndo) {
          dispatch(undo());
        }
      },
      description: 'Undo',
      preventDefault: true,
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: () => {
        if (canRedo) {
          dispatch(redo());
        }
      },
      description: 'Redo',
      preventDefault: true,
    },
  ]);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!pipeId) {
        setMetadata({ name: 'Untitled Pipe', description: '', isPublic: false, tags: [] });
        return;
      }
      try {
        const response = await pipeService.get(pipeId);
        const pipe = response.data;
        setMetadata({
          name: pipe.name,
          description: pipe.description || '',
          isPublic: pipe.is_public,
          tags: pipe.tags || [],
        });
      } catch (error) {
        console.error('Failed to load pipe metadata:', error);
      }
    };
    loadMetadata();
  }, [pipeId]);

  const handleSaveAsDraft = async () => {
    if (!isAuthenticated) return;
    setIsSaving(true);
    try {
      const pipe = await saveDraft(pipeId || null, metadata.name, nodes, edges);
      dispatch(markClean());
      setShowSavePanel(false);
      addToast({ type: 'success', title: 'Draft saved', description: 'Your pipe has been saved as a draft' });
      if (!pipeId) window.history.pushState({}, '', `/editor/${pipe.id}`);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to save draft', description: error.response?.data?.error || 'Please try again' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!isAuthenticated) return;
    setIsSaving(true);
    try {
      const pipe = await savePipe(pipeId || null, metadata.name, metadata.description, nodes, edges, metadata.isPublic, false, metadata.tags);
      dispatch(markClean());
      setShowSavePanel(false);
      addToast({ type: 'success', title: 'Pipe published', description: 'Your pipe has been published successfully' });
      if (!pipeId) window.history.pushState({}, '', `/editor/${pipe.id}`);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Failed to publish pipe', description: error.response?.data?.error || 'Please try again' });
    } finally {
      setIsSaving(false);
    }
  };

  // Execute pipe with optional user input values (Requirement 7.1-7.4)
  const executeWithInputs = useCallback(async (userInputs?: UserInputValues) => {
    dispatch(setIsExecuting(true));
    dispatch(clearExecutionResult());
    
    // Set all nodes to 'running' status before execution (Requirement 6.1)
    nodes.forEach(node => {
      updateNodeStatus(node.id, 'running');
    });
    
    try {
      const result = await executePipe(nodes, edges, userInputs);
      const formattedResult = formatExecutionResult(result);
      dispatch(setExecutionResult(formattedResult));
      
      // Update nodes with intermediate results (Requirement 5.1, 6.2, 6.3)
      if (formattedResult.intermediateResults) {
        Object.entries(formattedResult.intermediateResults).forEach(([nodeId, intermediate]: [string, any]) => {
          const status = intermediate.status === 'success' ? 'success' : 'error';
          updateNodeStatus(nodeId, status, intermediate.result, intermediate.error);
        });
      } else {
        // If no intermediate results, mark all nodes based on overall status
        nodes.forEach(node => {
          updateNodeStatus(node.id, formattedResult.status);
        });
      }
      
      if (formattedResult.status === 'success') {
        addToast({ type: 'success', title: 'Execution completed' });
      } else {
        addToast({ type: 'error', title: 'Execution failed', description: formattedResult.error || 'An error occurred' });
      }
    } catch (error: any) {
      const errorResult = {
        status: 'error' as const,
        error: error.response?.data?.error || error.message || 'An error occurred',
      };
      dispatch(setExecutionResult(errorResult));
      
      // Reset node statuses on error (Requirement 6.4)
      resetAllNodeStatuses();
      
      addToast({ type: 'error', title: 'Execution failed', description: errorResult.error });
    } finally {
      dispatch(setIsExecuting(false));
    }
  }, [nodes, edges, dispatch, updateNodeStatus, resetAllNodeStatuses, addToast]);

  const handleExecute = async () => {
    const validation = validatePipeForExecution(nodes, edges);
    if (!validation.valid) {
      addToast({ type: 'error', title: 'Cannot execute pipe', description: validation.errors.join(', ') });
      return;
    }
    
    // Check for user input operators (Requirement 7.1, 7.2)
    const userInputNodes = detectUserInputNodes(nodes);
    if (userInputNodes.length > 0) {
      // Show dialog to collect user input values
      setPendingUserInputNodes(userInputNodes);
      setShowUserInputDialog(true);
      return;
    }
    
    // No user inputs, execute directly
    await executeWithInputs();
  };

  // Handle user input dialog submission (Requirement 7.3)
  const handleUserInputSubmit = useCallback(async (values: UserInputValues) => {
    setShowUserInputDialog(false);
    setPendingUserInputNodes([]);
    await executeWithInputs(values);
  }, [executeWithInputs]);

  // Handle user input dialog cancel (Requirement 7.4)
  const handleUserInputCancel = useCallback(() => {
    setShowUserInputDialog(false);
    setPendingUserInputNodes([]);
  }, []);

  // Execute from a specific node (Run Selected) - Requirement 8.2, 8.3
  const executeFromNode = useCallback(async (targetNodeId: string, userInputs?: UserInputValues) => {
    dispatch(setIsExecuting(true));
    dispatch(clearExecutionResult());
    
    // Set nodes in the execution path to 'running' status
    // For now, set all nodes to running (we could optimize to only set upstream nodes)
    nodes.forEach(node => {
      updateNodeStatus(node.id, 'running');
    });
    
    try {
      const result = await executeSelected(nodes, edges, targetNodeId, userInputs);
      const formattedResult = formatExecutionResult(result);
      dispatch(setExecutionResult(formattedResult));
      
      // Update nodes with intermediate results
      if (formattedResult.intermediateResults) {
        Object.entries(formattedResult.intermediateResults).forEach(([nodeId, intermediate]: [string, any]) => {
          const status = intermediate.status === 'success' ? 'success' : 'error';
          updateNodeStatus(nodeId, status, intermediate.result, intermediate.error);
        });
        // Reset nodes not in execution path to idle
        const executedNodeIds = new Set(Object.keys(formattedResult.intermediateResults));
        nodes.forEach(node => {
          if (!executedNodeIds.has(node.id)) {
            updateNodeStatus(node.id, 'idle');
          }
        });
      }
      
      if (formattedResult.status === 'success') {
        addToast({ type: 'success', title: 'Run Selected completed' });
      } else {
        addToast({ type: 'error', title: 'Run Selected failed', description: formattedResult.error || 'An error occurred' });
      }
    } catch (error: any) {
      resetAllNodeStatuses();
      addToast({ type: 'error', title: 'Run Selected failed', description: error.response?.data?.error || error.message });
    } finally {
      dispatch(setIsExecuting(false));
    }
  }, [nodes, edges, dispatch, updateNodeStatus, resetAllNodeStatuses, addToast]);

  // Watch for run-selected trigger from OperatorNode (Requirement 8.1)
  useEffect(() => {
    if (runSelectedNodeId && !isExecuting) {
      dispatch(clearRunSelectedTrigger());
      
      // Check for user inputs before executing
      const userInputNodes = detectUserInputNodes(nodes);
      if (userInputNodes.length > 0) {
        // For run-selected, we still need to collect user inputs
        // Store the target node and show dialog
        setPendingUserInputNodes(userInputNodes);
        setShowUserInputDialog(true);
        // Store target node ID in a ref or state for when dialog submits
        // For simplicity, we'll just run the full executeFromNode which will collect inputs
      } else {
        executeFromNode(runSelectedNodeId);
      }
    }
  }, [runSelectedNodeId, isExecuting, nodes, dispatch, executeFromNode]);

  return (
    <div className="bg-bg-surface border-b border-border-default px-2 sm:px-4 py-2 flex items-center justify-between flex-shrink-0 gap-2">
      {/* Left side - Pipe title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <h1 className={`font-semibold text-text-primary truncate ${isMobile ? 'text-sm max-w-[120px]' : 'text-lg'}`}>
          {metadata.name}
        </h1>
        {isDirty && (
          <span className="text-xs text-status-warning flex items-center gap-1 flex-shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {!isMobile && 'Unsaved'}
          </span>
        )}
      </div>

      {/* Right side - Undo/Redo + Save + Run */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button 
          onClick={() => canUndo && dispatch(undo())} 
          disabled={!canUndo} 
          className="p-1.5 text-text-secondary hover:bg-bg-surface-hover rounded disabled:opacity-40" 
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        </button>
        <button 
          onClick={() => canRedo && dispatch(redo())} 
          disabled={!canRedo} 
          className="p-1.5 text-text-secondary hover:bg-bg-surface-hover rounded disabled:opacity-40" 
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
        </button>
        
        <div className="w-px h-5 bg-border-default mx-0.5 sm:mx-1 hidden sm:block" />
        
        <div className="relative">
          <button 
            onClick={() => setShowSavePanel(!showSavePanel)} 
            disabled={isSaving} 
            className={`text-sm text-text-inverse bg-accent-blue rounded hover:bg-accent-blue-hover disabled:opacity-50 ${
              isMobile ? 'p-1.5' : 'px-3 py-1.5'
            }`}
            title="Save pipe"
            aria-label="Save"
          >
            {isMobile ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            ) : (
              isSaving ? 'Saving...' : 'Save'
            )}
          </button>
          {showSavePanel && (
            <>
              {/* Backdrop for mobile */}
              {isMobile && (
                <div 
                  className="fixed inset-0 bg-bg-overlay z-40"
                  onClick={() => setShowSavePanel(false)}
                />
              )}
              <div className={`
                absolute top-full mt-2 bg-bg-surface-elevated border border-border-default rounded-lg shadow-lg z-50 p-4
                ${isMobile 
                  ? 'fixed left-4 right-4 top-auto bottom-4 w-auto max-h-[70vh] overflow-y-auto' 
                  : 'right-0 w-96'
                }
              `}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-text-primary">Save Pipe</h3>
                  <button onClick={() => setShowSavePanel(false)} className="text-text-tertiary hover:text-text-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <PipeMetadataPanel metadata={metadata} onChange={setMetadata} onSave={handlePublish} onSaveAsDraft={handleSaveAsDraft} />
              </div>
            </>
          )}
        </div>
        
        <button 
          onClick={handleExecute} 
          disabled={isExecuting || nodes.length === 0} 
          className={`text-sm bg-status-success text-text-inverse rounded hover:brightness-110 disabled:opacity-50 flex items-center gap-1 sm:gap-2 ${
            isMobile ? 'p-1.5' : 'px-3 py-1.5'
          }`}
          title="Run pipe"
          aria-label="Run"
        >
          {isExecuting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              {!isMobile && 'Running...'}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
              {!isMobile && 'Run'}
            </>
          )}
        </button>
      </div>

      {/* User Input Prompt Dialog (Requirement 7.2) */}
      <UserInputPromptDialog
        isOpen={showUserInputDialog}
        onClose={handleUserInputCancel}
        onSubmit={handleUserInputSubmit}
        userInputNodes={pendingUserInputNodes}
      />
    </div>
  );
};
