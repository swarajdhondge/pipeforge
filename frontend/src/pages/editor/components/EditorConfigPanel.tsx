import { type FC, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { updateNode, setSelectedNode, saveToHistory } from '../../../store/slices/canvas-slice';
import { useMediaQuery } from '../../../hooks/use-media-query';

// Import inline config components
import {
  FetchJSONInlineConfig,
  FetchCSVInlineConfig,
  FetchRSSInlineConfig,
  FetchPageInlineConfig,
  FilterInlineConfig,
  SortInlineConfig,
  TextInputInlineConfig,
  NumberInputInlineConfig,
  URLInputInlineConfig,
  DateInputInlineConfig,
  UniqueInlineConfig,
  TruncateInlineConfig,
  TailInlineConfig,
  RenameInlineConfig,
  StringReplaceInlineConfig,
  RegexInlineConfig,
  SubstringInlineConfig,
  URLBuilderInlineConfig,
  PipeOutputInlineConfig,
} from '../../../components/editor/inline-config';

/**
 * EditorConfigPanel - Right-side configuration panel
 * 
 * Width: 300px
 * Hidden by default, opens when node is clicked
 * Slides in from right
 * 
 * Requirements: 3.3, 6.3
 * Responsive: Overlay on screens < 1200px
 */

interface EditorConfigPanelProps {
  selectedNodeId: string | null;
  isOpen: boolean;
  onClose?: () => void;
}

export const EditorConfigPanel: FC<EditorConfigPanelProps> = ({
  selectedNodeId,
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.canvas.nodes);
  
  // Responsive behavior (Requirements 6.3)
  // On screens < 1200px, panel should overlay instead of push
  const isLargeScreen = useMediaQuery('(min-width: 1200px)');
  
  // Find the selected node
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // Handle config change - uses any to support various config types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConfigChange = useCallback((newConfig: any) => {
    if (!selectedNodeId) return;
    dispatch(saveToHistory());
    dispatch(updateNode({
      id: selectedNodeId,
      data: { config: newConfig },
    }));
  }, [selectedNodeId, dispatch]);

  // Handle label change
  const handleLabelChange = useCallback((newLabel: string) => {
    if (!selectedNodeId) return;
    dispatch(saveToHistory());
    dispatch(updateNode({
      id: selectedNodeId,
      data: { label: newLabel },
    }));
  }, [selectedNodeId, dispatch]);

  // Handle close
  const handleClose = () => {
    dispatch(setSelectedNode(null));
    onClose?.();
  };

  // Render config component based on node type
  const renderConfigComponent = () => {
    if (!selectedNode) return null;
    
    const nodeType = selectedNode.type;
    const config = selectedNode.data?.config || {};

    // Common props for all config components
    const commonProps = {
      config,
      onConfigChange: handleConfigChange,
      nodeId: selectedNodeId!,
    };

    switch (nodeType) {
      // Source operators
      case 'fetch-json':
        return <FetchJSONInlineConfig {...commonProps} />;
      case 'fetch-csv':
        return <FetchCSVInlineConfig {...commonProps} />;
      case 'fetch-rss':
        return <FetchRSSInlineConfig {...commonProps} />;
      case 'fetch-page':
        return <FetchPageInlineConfig {...commonProps} />;
      
      // Filter and Sort
      case 'filter':
        return <FilterInlineConfig {...commonProps} />;
      case 'sort':
        return <SortInlineConfig {...commonProps} />;
      
      // User Input operators
      case 'text-input':
        return <TextInputInlineConfig {...commonProps} />;
      case 'number-input':
        return <NumberInputInlineConfig {...commonProps} />;
      case 'url-input':
        return <URLInputInlineConfig {...commonProps} />;
      case 'date-input':
        return <DateInputInlineConfig {...commonProps} />;
      
      // Transform operators
      case 'unique':
        return <UniqueInlineConfig {...commonProps} />;
      case 'truncate':
        return <TruncateInlineConfig {...commonProps} />;
      case 'tail':
        return <TailInlineConfig {...commonProps} />;
      case 'rename':
        return <RenameInlineConfig {...commonProps} />;
      case 'transform':
        // Transform uses the same component as Rename for now
        return <RenameInlineConfig {...commonProps} />;
      
      // String operators
      case 'string-replace':
        return <StringReplaceInlineConfig {...commonProps} />;
      case 'regex':
        return <RegexInlineConfig {...commonProps} />;
      case 'substring':
        return <SubstringInlineConfig {...commonProps} />;
      
      // URL operators
      case 'url-builder':
        return <URLBuilderInlineConfig {...commonProps} />;
      
      // Special operators
      case 'pipe-output':
        return <PipeOutputInlineConfig {...commonProps} />;
      
      default:
        return (
          <div className="p-4 text-sm text-text-tertiary">
            No configuration available for this operator type.
          </div>
        );
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // On small screens, render as overlay with backdrop
  // Requirements 6.3: Overlay instead of push on viewport < 1200px
  if (!isLargeScreen) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={handleClose}
          aria-label="Close configuration panel"
        />
        
        {/* Overlay Panel */}
        <div className="fixed right-0 top-0 bottom-0 w-[300px] bg-bg-surface border-l border-border-default flex flex-col overflow-hidden z-50 shadow-2xl transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-4 border-b border-border-default flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {selectedNode ? (
                <input
                  type="text"
                  value={selectedNode.data?.label || ''}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="w-full text-sm font-semibold text-text-primary bg-transparent border-none focus:outline-none focus:ring-0 truncate"
                  placeholder="Operator name"
                />
              ) : (
                <h2 className="text-sm font-semibold text-text-primary">Configuration</h2>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-text-quaternary hover:text-text-secondary hover:bg-bg-surface-hover rounded-md transition-colors"
              title="Close panel"
              aria-label="Close configuration panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Config Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedNode ? (
              <div className="p-4">
                {/* Node Type Badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-accent-purple-dark bg-accent-purple-light rounded">
                    {selectedNode.type}
                  </span>
                </div>
                
                {/* Config Component */}
                {renderConfigComponent()}
              </div>
            ) : (
              <div className="p-4 text-center text-text-tertiary">
                <svg className="w-12 h-12 mx-auto mb-2 text-text-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Select an operator to configure</p>
              </div>
            )}
          </div>

          {/* Footer with help */}
          {selectedNode && (
            <div className="p-3 border-t border-border-default">
              <div className="p-2.5 bg-bg-surface-secondary border border-border-default rounded-lg">
                <p className="text-xs text-text-secondary">
                  💡 Changes are saved automatically. Press Escape or click outside to close.
                </p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // On large screens, render as side panel (normal behavior)
  return (
    <div className="w-[300px] flex-shrink-0 h-full bg-bg-surface border-l border-border-default flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-border-default flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {selectedNode ? (
            <input
              type="text"
              value={selectedNode.data?.label || ''}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full text-sm font-semibold text-text-primary bg-transparent border-none focus:outline-none focus:ring-0 truncate"
              placeholder="Operator name"
            />
          ) : (
            <h2 className="text-sm font-semibold text-text-primary">Configuration</h2>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 text-text-quaternary hover:text-text-secondary hover:bg-bg-surface-hover rounded-md transition-colors"
          title="Close panel"
          aria-label="Close configuration panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Config Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <div className="p-4">
            {/* Node Type Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-accent-purple-dark bg-accent-purple-light rounded">
                {selectedNode.type}
              </span>
            </div>
            
            {/* Config Component */}
            {renderConfigComponent()}
          </div>
        ) : (
          <div className="p-4 text-center text-text-tertiary">
            <svg className="w-12 h-12 mx-auto mb-2 text-text-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Select an operator to configure</p>
          </div>
        )}
      </div>

      {/* Footer with help */}
      {selectedNode && (
        <div className="p-3 border-t border-border-default">
          <div className="p-2.5 bg-bg-surface-secondary border border-border-default rounded-lg">
            <p className="text-xs text-text-secondary">
              💡 Changes are saved automatically. Press Escape or click outside to close.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
