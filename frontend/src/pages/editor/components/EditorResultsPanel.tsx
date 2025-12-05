import { useState, useRef, useEffect, type FC } from 'react';

/**
 * EditorResultsPanel - Bottom panel for execution results
 * 
 * Hidden by default, shows after execution
 * Collapsible with tab indicator
 * Resizable height
 * 
 * Requirements: 1.3
 */

interface IntermediateResult {
  nodeId: string;
  type: string;
  label: string;
  result: unknown;
  executionTime: number;
  status: 'success' | 'error';
  error?: string;
}

interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
  operatorType: string;
  operatorLabel: string;
}

interface ExecutionResult {
  status: 'success' | 'error';
  result?: unknown;
  error?: string;
  intermediateResults?: Record<string, IntermediateResult>;
  executionOrder?: string[];
  executionTime?: number;
  executionInfo?: string;
  failedNodeId?: string;
  failedOperatorType?: string;
  validationErrors?: ValidationError[];
}

interface EditorResultsPanelProps {
  result?: ExecutionResult | null;
  isExecuting?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onClearResults?: () => void;
}

export const EditorResultsPanel: FC<EditorResultsPanelProps> = ({
  result,
  isExecuting = false,
  isOpen: controlledOpen,
  onToggle,
  onClearResults,
}) => {
  // Internal open state (can be controlled or uncontrolled)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  
  const [showIntermediate, setShowIntermediate] = useState(false);
  
  // Resizable panel state
  const [panelHeight, setPanelHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const MIN_HEIGHT = 150;
  const MAX_HEIGHT = 600;

  // Auto-open when result arrives
  useEffect(() => {
    if (result && !controlledOpen) {
      setInternalOpen(true);
    }
  }, [result, controlledOpen]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const newHeight = window.innerHeight - e.clientY;
      const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
      setPanelHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Collapsed tab indicator (always visible when there's a result)
  if (!isOpen && result) {
    return (
      <div className="bg-bg-surface border-t border-border-default h-10">
        <button
          onClick={handleToggle}
          className="w-full h-full px-4 py-2 flex items-center justify-between hover:bg-bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${result.status === 'success' ? 'bg-status-success' : 'bg-status-error'}`} />
            <span className="text-sm font-medium text-text-primary">
              {result.status === 'success' ? 'Execution Successful' : 'Execution Failed'}
            </span>
            {result.executionTime && (
              <span className="text-xs text-text-tertiary">({result.executionTime}ms)</span>
            )}
          </div>
          <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // Hidden when no result and not executing - return empty div with 0 height
  if (!isOpen && !result && !isExecuting) {
    return <div className="h-0" />;
  }

  // Full panel view
  return (
    <div 
      ref={panelRef}
      className="bg-bg-surface border-t border-border-default shadow-lg relative flex flex-col"
      style={{ height: isOpen ? `${panelHeight}px` : '40px' }}
    >
      {/* Resize Handle */}
      {isOpen && (
        <div
          className={`absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-accent-purple transition-colors ${
            isResizing ? 'bg-accent-purple' : 'bg-transparent'
          }`}
          onMouseDown={() => setIsResizing(true)}
          title="Drag to resize panel"
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-border-strong rounded-full" />
        </div>
      )}
      
      {/* Header */}
      <div className="px-4 py-2 border-b border-border-default flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result && (
            <span className={`w-2 h-2 rounded-full ${result.status === 'success' ? 'bg-status-success' : 'bg-status-error'}`} />
          )}
          {isExecuting && (
            <svg className="w-4 h-4 animate-spin text-accent-purple" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          <span className="text-sm font-medium text-text-primary">
            {isExecuting ? 'Executing...' : result ? (result.status === 'success' ? 'Results' : 'Error') : 'Results'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <>
              <button
                onClick={() => setShowIntermediate(!showIntermediate)}
                className="px-2 py-1 text-xs font-medium text-text-secondary hover:bg-bg-surface-hover rounded transition-colors"
              >
                {showIntermediate ? 'Hide' : 'Show'} Steps
              </button>
              {onClearResults && (
                <button
                  onClick={onClearResults}
                  className="px-2 py-1 text-xs font-medium text-text-tertiary hover:bg-bg-surface-hover rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </>
          )}
          <button
            onClick={handleToggle}
            className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover rounded transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-auto p-4 min-h-0">
          {result && (
            <div className="space-y-4 max-w-7xl mx-auto">
              {/* Execution Info Banner */}
              {result.executionInfo && (
                <div className="bg-status-info-light border border-status-info rounded-md px-3 py-2 text-sm text-status-info-dark">
                  ℹ️ {result.executionInfo}
                </div>
              )}

              {/* Validation Errors */}
              {result.validationErrors && result.validationErrors.length > 0 && (
                <div className="bg-status-warning-light border border-status-warning rounded-md p-3">
                  <h4 className="text-sm font-semibold text-status-warning-dark mb-2">⚠️ Validation Errors</h4>
                  <ul className="space-y-1">
                    {result.validationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-status-warning-dark">
                        <span className="font-medium">{error.operatorLabel || error.operatorType}:</span>{' '}
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Final Result */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-sm font-semibold flex items-center gap-2 ${
                    result.status === 'success' ? 'text-status-success-dark' : 'text-status-error-dark'
                  }`}>
                    {result.status === 'success' ? (
                      <>
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-status-success-light rounded-full">
                          <svg className="w-3 h-3 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        Success
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-status-error-light rounded-full">
                          <svg className="w-3 h-3 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                        Failed
                      </>
                    )}
                  </h3>
                  {result.status === 'success' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(result.result, null, 2))}
                        className="px-2.5 py-1 text-xs bg-accent-purple text-white hover:bg-accent-purple-dark rounded transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy JSON
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(result.result, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'pipe-result.json';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-2.5 py-1 text-xs bg-bg-surface-secondary border border-border-default text-text-secondary hover:bg-bg-surface-hover rounded transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  )}
                </div>
                <div className="bg-bg-surface-secondary border border-border-default rounded-md p-3 max-h-48 overflow-auto">
                  {result.status === 'success' ? (
                    <pre className="text-xs text-text-primary whitespace-pre-wrap font-mono">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-sm text-status-error whitespace-pre-wrap">{result.error}</div>
                  )}
                </div>
                {result.executionTime && (
                  <p className="mt-1 text-xs text-text-tertiary">
                    Execution time: {result.executionTime}ms
                  </p>
                )}
              </div>

              {/* Intermediate Results */}
              {showIntermediate && result.intermediateResults && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Execution Steps
                  </h3>
                  {result.executionOrder && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-text-tertiary overflow-x-auto pb-2">
                      {result.executionOrder.map((nodeId, index) => {
                        const intermediate = result.intermediateResults?.[nodeId];
                        const isError = intermediate?.status === 'error';
                        return (
                          <div key={nodeId} className="flex items-center">
                            <span className={`px-2 py-1 rounded whitespace-nowrap ${isError ? 'bg-status-error-light text-status-error-dark' : 'bg-status-success-light text-status-success-dark'}`}>
                              {intermediate?.label || intermediate?.type || nodeId}
                            </span>
                            {index < result.executionOrder!.length - 1 && (
                              <span className="mx-1 text-text-tertiary">→</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="space-y-2">
                    {Object.entries(result.intermediateResults).map(([nodeId, intermediate]) => {
                      const isError = intermediate.status === 'error';
                      return (
                        <div 
                          key={nodeId} 
                          className={`border rounded-md p-3 ${isError ? 'bg-status-error-light border-status-error' : 'bg-bg-surface-secondary border-border-default'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-xs rounded bg-bg-surface-hover text-text-secondary">
                                {intermediate.type}
                              </span>
                              <span className="text-xs font-medium text-text-primary">
                                {intermediate.label}
                              </span>
                              <span className="text-xs text-text-tertiary">
                                ({intermediate.executionTime}ms)
                              </span>
                              {isError && (
                                <span className="text-xs text-status-error font-medium">❌ Failed</span>
                              )}
                            </div>
                            {!isError && (
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(intermediate.result, null, 2))}
                                className="text-xs text-accent-purple hover:text-accent-purple-dark flex items-center gap-0.5"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </button>
                            )}
                          </div>
                          {isError ? (
                            <div className="text-xs text-status-error mt-1">{intermediate.error}</div>
                          ) : (
                            <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-24 overflow-auto mt-1 font-mono">
                              {JSON.stringify(intermediate.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && !isExecuting && (
            <div className="text-center py-8 text-text-tertiary">
              <svg className="w-12 h-12 mx-auto mb-2 text-border-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm">Run your pipe to see results here</p>
            </div>
          )}

          {/* Executing State */}
          {isExecuting && (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-2 text-accent-purple animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-text-secondary">Executing pipe...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
