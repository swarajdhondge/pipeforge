import { type FC, useState } from 'react';
import type { PipeOutputConfig } from '../../../types/operator.types';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';

interface PipeOutputInlineConfigProps {
  nodeId: string;
  config: PipeOutputConfig;
  onConfigChange: (config: PipeOutputConfig) => void;
  result?: any;
  status?: 'idle' | 'running' | 'success' | 'error';
  error?: string;
}

/**
 * Inline configuration component for Pipe Output operator.
 * Displays result preview with first 3-5 items and "View All" button.
 * 
 * Requirements: 
 * - 10.1: Show item count and first 3-5 items
 * - 10.2: Auto-expand on execution complete
 * - 10.3: "View All" button for full results modal
 * - 10.4: Full JSON with syntax highlighting
 * - 5.1, 5.2, 5.3: Display fetched data from Fetch JSON operator
 */
export const PipeOutputInlineConfig: FC<PipeOutputInlineConfigProps> = ({
  nodeId: _nodeId,
  result,
  status = 'idle',
  error,
}) => {
  const [showFullModal, setShowFullModal] = useState(false);
  
  // Determine if we're currently executing
  const isExecuting = status === 'running';

  // Format preview showing first 3-5 items
  const formatPreview = (data: unknown): string => {
    if (data === undefined || data === null) {
      return 'No data';
    }
    
    try {
      if (Array.isArray(data)) {
        // Show first 5 items for arrays
        const preview = data.slice(0, 5);
        return JSON.stringify(preview, null, 2);
      } else {
        // For objects, show full but truncate if too long
        const str = JSON.stringify(data, null, 2);
        if (str.length > 300) {
          return str.substring(0, 300) + '\n...';
        }
        return str;
      }
    } catch {
      return String(data);
    }
  };

  // Format full result for modal
  const formatFullResult = (data: unknown): string => {
    if (data === undefined || data === null) {
      return 'No data';
    }
    
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  // Get item count if result is an array
  const getItemCount = (data: unknown): number | null => {
    if (Array.isArray(data)) {
      return data.length;
    }
    return null;
  };

  const itemCount = result ? getItemCount(result) : null;
  const hasMoreItems = itemCount !== null && itemCount > 5;

  return (
    <>
      <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        {/* Info Message */}
        <div className="text-xs text-text-tertiary flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Final output of the pipe</span>
        </div>

        {/* Loading State */}
        {isExecuting && (
          <div className="text-xs text-accent-blue italic bg-accent-blue-light px-2 py-3 rounded text-center">
            <svg className="h-5 w-5 mx-auto mb-1 text-accent-blue animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Executing pipe...
          </div>
        )}

        {/* Error State - Requirement 10.5 */}
        {!isExecuting && status === 'error' && error && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-status-error-dark">Error</span>
            <div className="bg-status-error-light border border-status-error rounded p-2">
              <pre className="text-[10px] text-status-error-dark font-mono whitespace-pre-wrap break-all">
                {error}
              </pre>
            </div>
          </div>
        )}

        {/* Result Preview - Auto-expanded when execution completes */}
        {!isExecuting && status === 'success' && result !== undefined ? (
          <div className="space-y-1">
            {/* Check for empty results - Requirement 5.4 */}
            {(result === null || 
              result === '' || 
              (Array.isArray(result) && result.length === 0) ||
              (typeof result === 'object' && Object.keys(result).length === 0)) ? (
              <div className="text-xs text-status-warning italic bg-status-warning-light px-2 py-3 rounded text-center border border-status-warning">
                <svg className="h-6 w-6 mx-auto mb-1 text-status-warning-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <div className="font-medium">No data returned</div>
                <div className="text-[10px] mt-1">The pipe executed successfully but returned no data. Check your source URL or filters.</div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-status-success-dark">Results</span>
                  {itemCount !== null && (
                    <span className="text-[10px] text-status-success-dark bg-status-success-light px-1.5 py-0.5 rounded font-medium">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {/* Preview showing first 3-5 items */}
                <div className="bg-status-success-light border border-status-success rounded p-2 max-h-40 overflow-auto">
                  <pre className="text-[10px] text-text-secondary font-mono whitespace-pre-wrap break-all">
                    {formatPreview(result)}
                  </pre>
                  {hasMoreItems && (
                    <div className="text-[10px] text-status-success-dark mt-1 italic">
                      ... and {itemCount! - 5} more item{itemCount! - 5 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* View All Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFullModal(true); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full text-xs text-status-success-dark hover:text-status-success font-medium py-1.5 px-2 rounded border border-status-success hover:border-status-success-dark bg-bg-surface hover:bg-status-success-light transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View All Results
                </button>
              </>
            )}
          </div>
        ) : !isExecuting && status === 'idle' ? (
          <div className="text-xs text-text-quaternary italic bg-bg-surface-secondary px-2 py-3 rounded text-center">
            <svg className="h-6 w-6 mx-auto mb-1 text-text-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Run the pipe to see output
          </div>
        ) : null}

        {/* No Configuration Needed */}
        <div className="text-[10px] text-text-quaternary pt-1 border-t border-border-muted">
          This operator passes through data unchanged. Connect it to the end of your pipe.
        </div>
      </div>

      {/* Full Results Modal */}
      <Modal
        isOpen={showFullModal}
        onClose={() => setShowFullModal(false)}
        title="Full Results"
        size="xl"
        footer={
          <Button variant="secondary" onClick={() => setShowFullModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          {itemCount !== null && (
            <div className="flex items-center justify-between pb-2 border-b border-border-default">
              <span className="text-sm font-medium text-text-secondary">Total Items</span>
              <span className="text-sm text-text-secondary bg-bg-surface-secondary px-2 py-1 rounded">
                {itemCount}
              </span>
            </div>
          )}
          
          {/* Syntax-highlighted JSON */}
          <div className="bg-bg-inverse rounded-lg p-4 max-h-[60vh] overflow-auto">
            <pre className="text-xs text-status-success font-mono whitespace-pre-wrap break-all">
              {formatFullResult(result)}
            </pre>
          </div>

          {/* Copy to Clipboard Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(formatFullResult(result));
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full text-sm text-text-secondary hover:text-text-primary font-medium py-2 px-3 rounded border border-border-default hover:border-border-strong bg-bg-surface hover:bg-bg-surface-hover transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy to Clipboard
          </button>
        </div>
      </Modal>
    </>
  );
};
