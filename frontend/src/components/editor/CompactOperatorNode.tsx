import { memo, useCallback, useMemo, type FC, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { useDispatch, useSelector } from 'react-redux';
import { updateNode } from '../../store/slices/canvas-slice';
import { validateOperatorConfig } from '../../utils/inline-validation';
import type { OperatorType, OperatorConfig } from '../../types/operator.types';
import type { RootState } from '../../store/store';

// Import all inline config components
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
} from './inline-config';

interface OperatorNodeData {
  label: string;
  config: OperatorConfig;
  status?: 'idle' | 'running' | 'success' | 'error';
  error?: string;
  validationErrors?: string[];
  result?: unknown;
  hasOutgoingConnection?: boolean;
  isValidDropTarget?: boolean;
  isInvalidDropTarget?: boolean;
}

// SVG Icons for operators
const GlobeIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const FilterIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const SortIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const TransformIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const InputIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const StringIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

const LinkIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const OutputIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const WarningIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// Operator type colors and icons
const operatorConfig: Record<string, { bg: string; border: string; icon: ReactNode }> = {
  // Sources
  'fetch': { bg: 'bg-secondary-50', border: 'border-secondary-400', icon: <GlobeIcon className="w-5 h-5 text-secondary-600" /> },
  'fetch-json': { bg: 'bg-secondary-50', border: 'border-secondary-400', icon: <GlobeIcon className="w-5 h-5 text-secondary-600" /> },
  'fetch-csv': { bg: 'bg-secondary-50', border: 'border-secondary-400', icon: <GlobeIcon className="w-5 h-5 text-secondary-600" /> },
  'fetch-rss': { bg: 'bg-secondary-50', border: 'border-secondary-400', icon: <GlobeIcon className="w-5 h-5 text-secondary-600" /> },
  'fetch-page': { bg: 'bg-secondary-50', border: 'border-secondary-400', icon: <GlobeIcon className="w-5 h-5 text-secondary-600" /> },
  // User Inputs
  'text-input': { bg: 'bg-purple-50', border: 'border-purple-400', icon: <InputIcon className="w-5 h-5 text-purple-600" /> },
  'number-input': { bg: 'bg-purple-50', border: 'border-purple-400', icon: <InputIcon className="w-5 h-5 text-purple-600" /> },
  'url-input': { bg: 'bg-purple-50', border: 'border-purple-400', icon: <InputIcon className="w-5 h-5 text-purple-600" /> },
  'date-input': { bg: 'bg-purple-50', border: 'border-purple-400', icon: <InputIcon className="w-5 h-5 text-purple-600" /> },
  // Operators
  'filter': { bg: 'bg-green-50', border: 'border-green-400', icon: <FilterIcon className="w-5 h-5 text-green-600" /> },
  'sort': { bg: 'bg-accent-50', border: 'border-accent-400', icon: <SortIcon className="w-5 h-5 text-accent-600" /> },
  'transform': { bg: 'bg-primary-50', border: 'border-primary-400', icon: <TransformIcon className="w-5 h-5 text-primary-600" /> },
  'unique': { bg: 'bg-teal-50', border: 'border-teal-400', icon: <TransformIcon className="w-5 h-5 text-teal-600" /> },
  'truncate': { bg: 'bg-teal-50', border: 'border-teal-400', icon: <TransformIcon className="w-5 h-5 text-teal-600" /> },
  'tail': { bg: 'bg-teal-50', border: 'border-teal-400', icon: <TransformIcon className="w-5 h-5 text-teal-600" /> },
  'rename': { bg: 'bg-teal-50', border: 'border-teal-400', icon: <TransformIcon className="w-5 h-5 text-teal-600" /> },
  // String operators
  'string-replace': { bg: 'bg-amber-50', border: 'border-amber-400', icon: <StringIcon className="w-5 h-5 text-amber-600" /> },
  'regex': { bg: 'bg-amber-50', border: 'border-amber-400', icon: <StringIcon className="w-5 h-5 text-amber-600" /> },
  'substring': { bg: 'bg-amber-50', border: 'border-amber-400', icon: <StringIcon className="w-5 h-5 text-amber-600" /> },
  // URL operators
  'url-builder': { bg: 'bg-indigo-50', border: 'border-indigo-400', icon: <LinkIcon className="w-5 h-5 text-indigo-600" /> },
  // Special
  'pipe-output': { bg: 'bg-rose-50', border: 'border-rose-400', icon: <OutputIcon className="w-5 h-5 text-rose-600" /> },
};

// Source operators that should not have input handles
const SOURCE_OPERATORS: OperatorType[] = [
  'fetch', 'fetch-json', 'fetch-csv', 'fetch-rss', 'fetch-page',
  'text-input', 'number-input', 'url-input', 'date-input',
];

const isSourceOperator = (type: string): boolean => {
  return SOURCE_OPERATORS.includes(type as OperatorType);
};

const getOperatorConfig = (type: string) => {
  return operatorConfig[type] || operatorConfig.transform;
};

/**
 * CompactOperatorNode component with expand/collapse behavior.
 * 
 * Requirements:
 * - 8.1: Show only icon, name, and connection handles by default (~60px height)
 * - 8.2: Expand to show inline config on click
 * - 8.3: Collapse on click outside
 * - 8.4: Only one node expanded at a time
 * - 8.5: Warning badge for validation errors in compact mode
 */
export const CompactOperatorNode: FC<NodeProps<OperatorNodeData>> = memo(({ id, data, selected, type }) => {
  const dispatch = useDispatch();
  const { label, config } = data;
  const operatorType = type as OperatorType || 'transform';
  const nodeConfig = getOperatorConfig(operatorType);
  
  // Get expanded node ID from Redux state
  const expandedNodeId = useSelector((state: RootState) => 
    (state.canvas as any).expandedNodeId || null
  );
  
  const isExpanded = expandedNodeId === id;

  // Real-time validation
  const computedValidation = useMemo(() => {
    return validateOperatorConfig(operatorType, config);
  }, [operatorType, config]);

  const hasValidationErrors = computedValidation.errors.length > 0;

  // Handle node click to toggle expansion
  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Dispatch action to set this node as expanded (or collapse if already expanded)
    dispatch({ 
      type: 'canvas/setExpandedNode', 
      payload: isExpanded ? null : id 
    });
  }, [dispatch, id, isExpanded]);

  // Handle config changes from inline config components
  const handleConfigChange = useCallback((newConfig: OperatorConfig) => {
    dispatch(updateNode({ id, data: { config: newConfig } }));
  }, [dispatch, id]);

  // Render inline config based on operator type
  const renderInlineConfig = () => {
    const commonProps = {
      nodeId: id,
      config: config as any,
      onConfigChange: handleConfigChange,
    };

    // For Pipe Output, pass execution result data
    const pipeOutputProps = {
      ...commonProps,
      result: data.result,
      status: data.status,
      error: data.error,
    };

    switch (operatorType) {
      // Source operators
      case 'fetch':
      case 'fetch-json':
        return <FetchJSONInlineConfig {...commonProps} />;
      case 'fetch-csv':
        return <FetchCSVInlineConfig {...commonProps} />;
      case 'fetch-rss':
        return <FetchRSSInlineConfig {...commonProps} />;
      case 'fetch-page':
        return <FetchPageInlineConfig {...commonProps} />;
      
      // User Input operators
      case 'text-input':
        return <TextInputInlineConfig {...commonProps} />;
      case 'number-input':
        return <NumberInputInlineConfig {...commonProps} />;
      case 'url-input':
        return <URLInputInlineConfig {...commonProps} />;
      case 'date-input':
        return <DateInputInlineConfig {...commonProps} />;
      
      // Filter and Sort
      case 'filter':
        return <FilterInlineConfig {...commonProps} />;
      case 'sort':
        return <SortInlineConfig {...commonProps} />;
      
      // Transform operators
      case 'unique':
        return <UniqueInlineConfig {...commonProps} />;
      case 'truncate':
        return <TruncateInlineConfig {...commonProps} />;
      case 'tail':
        return <TailInlineConfig {...commonProps} />;
      case 'rename':
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
        return <PipeOutputInlineConfig {...pipeOutputProps} />;
      
      // Legacy transform
      case 'transform':
      default:
        return (
          <div className="px-3 py-2 text-xs text-neutral-600">
            <div className="flex items-center gap-1 text-neutral-400">
              <span>Configure in panel</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Input Handle - Only show for non-source operators */}
      {/* Requirement 7.2, 7.3, 7.4: Highlight valid/invalid drop targets during drag */}
      {!isSourceOperator(operatorType) && (
        <Handle
          type="target"
          position={Position.Left}
          className={`
            !w-3 !h-3 !rounded-full !-left-1.5 transition-all
            ${data.isValidDropTarget 
              ? '!bg-green-400 !border-2 !border-green-600 !shadow-lg !shadow-green-400/50 !scale-125' 
              : data.isInvalidDropTarget
              ? '!bg-red-400 !border-2 !border-red-600 !shadow-lg !shadow-red-400/50 animate-shake'
              : '!bg-neutral-100 !border-2 !border-neutral-400 hover:!border-primary-500 hover:!bg-primary-100'
            }
          `}
        />
      )}

      {/* Node Body */}
      <div
        onClick={handleNodeClick}
        className={`
          rounded-lg border-2 shadow-md min-w-[200px] max-w-[280px] overflow-hidden cursor-pointer
          ${nodeConfig.bg} ${nodeConfig.border}
          ${selected ? 'ring-2 ring-primary-400 ring-offset-2' : ''}
          ${isExpanded ? 'shadow-xl' : 'hover:shadow-lg'}
          transition-all duration-200
        `}
      >
        {/* Compact Header - Always visible (~60px height) */}
        <div className="px-3 py-2.5 flex items-center gap-2">
          <span className="flex-shrink-0">{nodeConfig.icon}</span>
          <span className="text-sm font-medium text-neutral-800 flex-1 truncate">{label}</span>
          
          {/* Validation warning badge - Requirement 8.5 */}
          {hasValidationErrors && (
            <span 
              className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center" 
              title={`${computedValidation.errors.length} validation error(s)`}
            >
              <WarningIcon className="w-3 h-3 text-yellow-900" />
            </span>
          )}
        </div>

        {/* Expanded Inline Configuration - Only visible when expanded */}
        {isExpanded && (
          <div className="border-t border-neutral-200">
            {renderInlineConfig()}
            
            {/* Validation Errors Display */}
            {hasValidationErrors && (
              <div className="px-3 py-2 bg-yellow-50 border-t border-yellow-200">
                <div className="text-xs text-yellow-800 space-y-1">
                  {computedValidation.errors.slice(0, 3).map((err, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <WarningIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{err.message}</span>
                    </div>
                  ))}
                  {computedValidation.errors.length > 3 && (
                    <div className="text-yellow-600 text-[10px]">
                      +{computedValidation.errors.length - 3} more error(s)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handle */}
      {/* Requirement 7.1: Pulsing indicator for unconnected outputs */}
      <Handle
        type="source"
        position={Position.Right}
        className={`
          !w-3 !h-3 !bg-neutral-400 !border-2 !border-neutral-100 !rounded-full !-right-1.5 
          hover:!bg-primary-500 transition-colors
          ${!data.hasOutgoingConnection ? 'animate-pulse-glow' : ''}
        `}
      />
    </div>
  );
});

CompactOperatorNode.displayName = 'CompactOperatorNode';
