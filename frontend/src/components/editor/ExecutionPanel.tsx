import { useState, useRef, useEffect, type FC } from 'react';

interface IntermediateResult {
  nodeId: string;
  type: string;
  label: string;
  result: any;
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
  result?: any;
  error?: string;
  intermediateResults?: Record<string, IntermediateResult>;
  executionOrder?: string[];
  executionTime?: number;
  executionInfo?: string;
  failedNodeId?: string;
  failedOperatorType?: string;
  validationErrors?: ValidationError[];
}

interface ExecutionPanelProps {
  onExecute: (mode: 'sync' | 'async') => Promise<void>;
  result: ExecutionResult | null;
  isExecuting: boolean;
  onClearResults?: () => void;
}

export const ExecutionPanel: FC<ExecutionPanelProps> = ({
  onExecute,
  result,
  isExecuting,
  onClearResults,
}) => {
  const [executionMode, setExecutionMode] = useState<'sync' | 'async'>('sync');
  const [showIntermediate, setShowIntermediate] = useState(false);
  
  // Resizable panel state
  const [panelHeight, setPanelHeight] = useState(300); // Default 300px
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const MIN_HEIGHT = 150;
  const MAX_HEIGHT = 600;

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      
      const newHeight = window.innerHeight - e.clientY;
      
      // Clamp height between min and max
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

  const handleExecute = () => {
    onExecute(executionMode);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div 
      ref={panelRef}
      className="bg-bg-surface border-t border-border-default shadow-lg relative"
      style={{ height: `${panelHeight}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-accent-purple transition-colors ${
          isResizing ? 'bg-accent-purple' : 'bg-transparent'
        }`}
        onMouseDown={() => setIsResizing(true)}
        title="Drag to resize panel"
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-border-strong rounded-full" />
      </div>
      
      <div className="h-full overflow-auto p-4">
        <div className="max-w-7xl mx-auto">
        {/* Execution Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-6 py-2 text-sm font-medium text-text-inverse bg-status-success rounded-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Executing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Pipe
                </>
              )}
            </button>

            <select
              value={executionMode}
              onChange={(e) => setExecutionMode(e.target.value as 'sync' | 'async')}
              disabled={isExecuting}
              className="px-3 py-2 text-sm border border-border-default rounded-md bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="sync">Sync (&lt; 30s)</option>
              <option value="async">Async (&lt; 5 min)</option>
            </select>
          </div>

          {result && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowIntermediate(!showIntermediate)}
                className="px-3 py-1.5 text-xs font-medium text-text-primary border border-border-default rounded-md hover:bg-bg-surface-hover"
              >
                {showIntermediate ? 'Hide' : 'Show'} Intermediate Results
              </button>
              {onClearResults && (
                <button
                  onClick={onClearResults}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border-default rounded-md hover:bg-bg-surface-hover"
                >
                  Clear Results
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
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
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-status-success-light rounded-full animate-bounceIn">
                        <svg className="w-4 h-4 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      Execution Successful
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-status-error-light rounded-full">
                        <svg className="w-4 h-4 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      Execution Failed
                    </>
                  )}
                </h3>
                {result.status === 'success' && (
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(result.result, null, 2))}
                    className="px-2 py-1 text-xs text-text-link hover:bg-bg-surface-hover rounded"
                  >
                    Copy to Clipboard
                  </button>
                )}
              </div>
              <div className="bg-bg-surface-secondary border border-border-default rounded-md p-3 max-h-64 overflow-auto">
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
                  Operator Execution Flow
                </h3>
                {/* Execution flow visualization */}
                {result.executionOrder && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-text-tertiary overflow-x-auto pb-2">
                    {result.executionOrder.map((nodeId, index) => {
                      const intermediate = result.intermediateResults?.[nodeId];
                      const isError = intermediate?.status === 'error';
                      return (
                        <div key={nodeId} className="flex items-center">
                          <span className={`px-2 py-1 rounded ${isError ? 'bg-status-error-light text-status-error-dark' : 'bg-status-success-light text-status-success-dark'}`}>
                            {intermediate?.label || intermediate?.type || nodeId}
                          </span>
                          {index < result.executionOrder!.length - 1 && (
                            <span className="mx-1 text-text-quaternary">→</span>
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
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              intermediate.type === 'fetch' ? 'bg-accent-blue-light text-accent-blue' :
                              intermediate.type === 'filter' ? 'bg-status-success-light text-status-success-dark' :
                              intermediate.type === 'sort' ? 'bg-status-warning-light text-status-warning-dark' :
                              intermediate.type === 'transform' ? 'bg-accent-purple-light text-accent-purple' :
                              'bg-bg-surface-hover text-text-secondary'
                            }`}>
                              {intermediate.type}
                            </span>
                            <span className="text-xs font-medium text-text-primary">
                              {intermediate.label}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              ({intermediate.executionTime}ms)
                            </span>
                            {isError && (
                              <span className="text-xs text-status-error font-medium">
                                ❌ Failed
                              </span>
                            )}
                          </div>
                          {!isError && (
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(intermediate.result, null, 2))}
                              className="text-xs text-text-link hover:underline"
                            >
                              Copy
                            </button>
                          )}
                        </div>
                        {isError ? (
                          <div className="text-xs text-status-error mt-1">
                            {intermediate.error}
                          </div>
                        ) : (
                          <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-32 overflow-auto mt-1 font-mono">
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
            <svg className="w-12 h-12 mx-auto mb-2 text-text-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm">Click "Run Pipe" to execute your workflow</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
