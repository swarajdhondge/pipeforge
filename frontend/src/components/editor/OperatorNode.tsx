import { memo, useState, useCallback, useEffect, useMemo, type FC, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { useDispatch } from 'react-redux';
import { updateNode, triggerRunSelected } from '../../store/slices/canvas-slice';
import { validateOperatorConfig } from '../../utils/inline-validation';
import type { OperatorType, OperatorConfig } from '../../types/operator.types';

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
  TransformMappingsInlineConfig,
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

// Operator type colors and icons - Pipe Forge inspired
// Node body uses theme-aware bg-bg-surface, colorful headers for visual identity
const operatorConfig: Record<string, { header: string; icon: ReactNode }> = {
  // Sources
  'fetch': {
    header: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
    icon: <GlobeIcon className="w-4 h-4 text-white" />,
  },
  'fetch-json': {
    header: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
    icon: <GlobeIcon className="w-4 h-4 text-white" />,
  },
  'fetch-csv': {
    header: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
    icon: <GlobeIcon className="w-4 h-4 text-white" />,
  },
  'fetch-rss': {
    header: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
    icon: <GlobeIcon className="w-4 h-4 text-white" />,
  },
  'fetch-page': {
    header: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
    icon: <GlobeIcon className="w-4 h-4 text-white" />,
  },
  // User Inputs
  'text-input': {
    header: 'bg-gradient-to-r from-purple-500 to-purple-600',
    icon: <InputIcon className="w-4 h-4 text-white" />,
  },
  'number-input': {
    header: 'bg-gradient-to-r from-purple-500 to-purple-600',
    icon: <InputIcon className="w-4 h-4 text-white" />,
  },
  'url-input': {
    header: 'bg-gradient-to-r from-purple-500 to-purple-600',
    icon: <InputIcon className="w-4 h-4 text-white" />,
  },
  'date-input': {
    header: 'bg-gradient-to-r from-purple-500 to-purple-600',
    icon: <InputIcon className="w-4 h-4 text-white" />,
  },
  // Operators
  'filter': {
    header: 'bg-gradient-to-r from-green-500 to-green-600',
    icon: <FilterIcon className="w-4 h-4 text-white" />,
  },
  'sort': {
    header: 'bg-gradient-to-r from-accent-500 to-accent-600',
    icon: <SortIcon className="w-4 h-4 text-white" />,
  },
  'transform': {
    header: 'bg-gradient-to-r from-primary-500 to-primary-600',
    icon: <TransformIcon className="w-4 h-4 text-white" />,
  },
  'unique': {
    header: 'bg-gradient-to-r from-teal-500 to-teal-600',
    icon: <TransformIcon className="w-4 h-4 text-white" />,
  },
  'truncate': {
    header: 'bg-gradient-to-r from-teal-500 to-teal-600',
    icon: <TransformIcon className="w-4 h-4 text-white" />,
  },
  'tail': {
    header: 'bg-gradient-to-r from-teal-500 to-teal-600',
    icon: <TransformIcon className="w-4 h-4 text-white" />,
  },
  'rename': {
    header: 'bg-gradient-to-r from-teal-500 to-teal-600',
    icon: <TransformIcon className="w-4 h-4 text-white" />,
  },
  // String operators
  'string-replace': {
    header: 'bg-gradient-to-r from-amber-500 to-amber-600',
    icon: <StringIcon className="w-4 h-4 text-white" />,
  },
  'regex': {
    header: 'bg-gradient-to-r from-amber-500 to-amber-600',
    icon: <StringIcon className="w-4 h-4 text-white" />,
  },
  'substring': {
    header: 'bg-gradient-to-r from-amber-500 to-amber-600',
    icon: <StringIcon className="w-4 h-4 text-white" />,
  },
  // URL operators
  'url-builder': {
    header: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    icon: <LinkIcon className="w-4 h-4 text-white" />,
  },
  // Special
  'pipe-output': {
    header: 'bg-gradient-to-r from-rose-500 to-rose-600',
    icon: <OutputIcon className="w-4 h-4 text-white" />,
  },
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
 * Enhanced OperatorNode component with inline configuration.
 * 
 * Requirements:
 * - 2.1: Render configuration UI inline within the node body
 * - 3.6: No input handle for source operators (fetch-*, *-input)
 * - 10.4: Display execution result on the node
 * - 13.3: Display result preview for Pipe Output
 * - 15.1, 15.5: Show validation errors with warning badge
 * - 16.7: Retry button for failed operators
 */
export const OperatorNode: FC<NodeProps<OperatorNodeData>> = memo(({ id, data, selected, type }) => {
  const dispatch = useDispatch();
  const { label, config, status = 'idle', error, validationErrors = [], result } = data;
  const operatorType = type as OperatorType || 'transform';
  const nodeConfig = getOperatorConfig(operatorType);
  // Note: upstreamSchema is passed to inline config components via their nodeId prop
  // They use useUpstreamSchema hook internally
  
  // State for showing/hiding result preview
  const [showFullResult, setShowFullResult] = useState(false);

  // Real-time validation - compute validation errors from config
  const computedValidation = useMemo(() => {
    return validateOperatorConfig(operatorType, config);
  }, [operatorType, config]);

  // Update node's validationErrors when validation changes
  useEffect(() => {
    const newErrors = computedValidation.errors.map(e => e.message);
    const currentErrors = validationErrors || [];
    
    // Only update if errors actually changed
    const errorsChanged = 
      newErrors.length !== currentErrors.length ||
      newErrors.some((err, idx) => err !== currentErrors[idx]);
    
    if (errorsChanged) {
      dispatch(updateNode({ id, data: { validationErrors: newErrors } }));
    }
  }, [computedValidation, validationErrors, dispatch, id]);

  // Handle config changes from inline config components
  const handleConfigChange = useCallback((newConfig: OperatorConfig) => {
    dispatch(updateNode({ id, data: { config: newConfig } }));
  }, [dispatch, id]);

  // Handle "Run Selected" click - triggers execution from this node (Requirement 8.1)
  const handleRunSelected = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(triggerRunSelected(id));
  }, [dispatch, id]);

  // Status-based styling overrides
  const getStatusStyles = () => {
    switch (status) {
      case 'running':
        return 'ring-2 ring-status-info ring-offset-2 shadow-lg';
      case 'success':
        return 'ring-2 ring-status-success ring-offset-2';
      case 'error':
        return 'ring-2 ring-status-error ring-offset-2';
      default:
        return '';
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'running':
        return (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-status-info flex items-center justify-center shadow-lg animate-pulse">
            <svg className="w-3 h-3 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-status-success flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-status-error flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  // Render inline config based on operator type
  const renderInlineConfig = () => {
    const commonProps = {
      nodeId: id,
      config: config as any,
      onConfigChange: handleConfigChange,
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
        return <PipeOutputInlineConfig {...commonProps} />;
      
      // Transform (field mappings)
      case 'transform':
        return <TransformMappingsInlineConfig {...commonProps} />;
      
      default:
        return (
          <div className="px-3 py-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1 text-text-tertiary">
              <span>Configure in panel</span>
            </div>
          </div>
        );
    }
  };

  // Format result for preview display
  const formatResult = (data: unknown): string => {
    if (data === undefined || data === null) {
      return 'No data';
    }
    try {
      const str = JSON.stringify(data, null, 2);
      if (!showFullResult && str.length > 200) {
        return str.substring(0, 200) + '...';
      }
      return str;
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

  // Use computed validation errors for display
  const displayValidationErrors = computedValidation.errors.map(e => e.message);
  const hasValidationErrors = displayValidationErrors.length > 0;
  const itemCount = result !== undefined ? getItemCount(result) : null;
  const resultStr = result !== undefined ? formatResult(result) : null;
  const isLongResult = result !== undefined && JSON.stringify(result).length > 200;

  return (
    <div className="relative">
      {/* Input Handle - Only show for non-source operators */}
      {!isSourceOperator(operatorType) && (
        <Handle
          type="target"
          position={Position.Left}
          className={`
            !w-4 !h-4 !rounded-full !-left-2 transition-all
            ${data.isValidDropTarget 
              ? '!bg-status-success !border-2 !border-status-success-dark !shadow-lg !scale-125' 
              : data.isInvalidDropTarget
              ? '!bg-status-error !border-2 !border-status-error-dark !shadow-lg animate-shake'
              : '!bg-bg-surface !border-2 !border-border-strong hover:!border-accent-purple hover:!bg-accent-purple-light'
            }
          `}
        />
      )}

      {/* Node Body - Theme-aware surface with colorful header */}
      <div
        className={`
          rounded-xl border shadow-lg min-w-[220px] max-w-[280px] overflow-hidden
          bg-bg-surface border-border-default
          ${selected ? 'ring-2 ring-accent-purple ring-offset-2' : ''}
          ${getStatusStyles()}
          transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5
        `}
      >
        {/* Header with gradient */}
        <div className={`${nodeConfig.header} px-3 py-2 flex items-center gap-2 group`}>
          <span className="flex-shrink-0">{nodeConfig.icon}</span>
          <span className="text-sm font-semibold text-white flex-1 truncate">{label}</span>
          
          {/* Run Selected button - shown on hover for non-source operators */}
          {!isSourceOperator(operatorType) && status !== 'running' && (
            <button
              onClick={handleRunSelected}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-opacity"
              title="Run from here"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
          
          {/* Validation warning badge */}
          {hasValidationErrors && (
            <span className="flex-shrink-0" title={`${validationErrors.length} validation error(s)`}>
              <WarningIcon className="w-4 h-4 text-yellow-300" />
            </span>
          )}
        </div>

        {/* Inline Configuration */}
        <div 
          className="border-b border-border-default nodrag nowheel"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {renderInlineConfig()}
        </div>

        {/* Validation Errors Display */}
        {hasValidationErrors && (
          <div className="px-3 py-2 bg-status-warning-light border-b border-status-warning">
            <div className="text-xs text-status-warning-dark space-y-1">
              {displayValidationErrors.slice(0, 3).map((err, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <WarningIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
              {displayValidationErrors.length > 3 && (
                <div className="text-status-warning text-[10px]">
                  +{displayValidationErrors.length - 3} more error(s)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result Preview Display */}
        {result !== undefined && status === 'success' && (
          <div className="px-3 py-2 bg-status-success-light border-b border-status-success">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-status-success-dark">Result</span>
              {itemCount !== null && (
                <span className="text-[10px] text-status-success bg-white/50 px-1.5 py-0.5 rounded">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="bg-bg-surface border border-status-success rounded p-1.5 max-h-24 overflow-auto">
              <pre className="text-[10px] text-text-primary font-mono whitespace-pre-wrap break-all">
                {resultStr}
              </pre>
            </div>
            {isLongResult && (
              <button
                onClick={() => setShowFullResult(!showFullResult)}
                className="text-[10px] text-status-success-dark hover:underline mt-1"
              >
                {showFullResult ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-3 py-2 bg-status-error-light">
            <div className="text-xs text-status-error bg-bg-surface px-2 py-1 rounded border border-status-error">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {getStatusIndicator()}

      {/* Output Handle - Pipe connector style */}
      <Handle
        type="source"
        position={Position.Right}
        className={`
          !w-4 !h-4 !bg-border-strong !border-2 !border-bg-surface !rounded-full !-right-2 
          hover:!bg-accent-purple transition-colors
          ${!data.hasOutgoingConnection ? 'animate-pulse-glow' : ''}
        `}
      />
    </div>
  );
});

OperatorNode.displayName = 'OperatorNode';
