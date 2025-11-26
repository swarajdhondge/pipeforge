import { useState, useEffect, useMemo, type FC, type DragEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNode, saveToHistory } from '../../store/slices/canvas-slice';
import type { RootState } from '../../store/store';
import type { Node } from 'reactflow';
import { Tooltip } from '../common/Tooltip';
import { Card } from '../common/Card';
import { useMediaQuery } from '../../hooks/use-media-query';
import { isAdvancedUser, getPipesUntilAdvanced } from '../../utils/user-experience-tracker';
// Generate sequential label for operators (e.g., "Fetch 1", "Fetch 2")
export const generateOperatorLabel = (type: string, existingNodes: Node[]): string => {
  const sameTypeNodes = existingNodes.filter((n) => n.type === type);
  const nextNumber = sameTypeNodes.length + 1;
  
  // Format type for display (e.g., "fetch-json" -> "Fetch JSON")
  const formattedType = type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return `${formattedType} ${nextNumber}`;
};

interface OperatorDefinition {
  type: string;
  label: string;
  icon: string;
  description: string;
  defaultConfig: Record<string, unknown>;
}

interface CategoryDefinition {
  id: string;
  label: string;
  icon: string;
  color: string;
  operators: OperatorDefinition[];
}

// Category color schemes
const categoryColors: Record<string, { bg: string; border: string; hover: string; header: string }> = {
  common: {
    bg: 'bg-accent-purple-light',
    border: 'border-accent-purple-muted',
    hover: 'hover:border-accent-purple hover:bg-accent-purple-muted',
    header: 'text-accent-purple-dark bg-accent-purple-light',
  },
  sources: {
    bg: 'bg-accent-blue-light',
    border: 'border-accent-blue-muted',
    hover: 'hover:border-accent-blue hover:bg-accent-blue-muted',
    header: 'text-accent-blue-dark bg-accent-blue-light',
  },
  'user-inputs': {
    bg: 'bg-accent-purple-light',
    border: 'border-accent-purple-muted',
    hover: 'hover:border-accent-purple hover:bg-accent-purple-muted',
    header: 'text-accent-purple-dark bg-accent-purple-light',
  },
  operators: {
    bg: 'bg-status-success-light',
    border: 'border-status-success',
    hover: 'hover:border-status-success-dark hover:bg-status-success-light',
    header: 'text-status-success-dark bg-status-success-light',
  },
  string: {
    bg: 'bg-accent-orange-light',
    border: 'border-accent-orange-muted',
    hover: 'hover:border-accent-orange hover:bg-accent-orange-muted',
    header: 'text-accent-orange-dark bg-accent-orange-light',
  },
  url: {
    bg: 'bg-accent-blue-light',
    border: 'border-accent-blue-muted',
    hover: 'hover:border-accent-blue hover:bg-accent-blue-muted',
    header: 'text-accent-blue-dark bg-accent-blue-light',
  },
};

// Operator categories organized per UX Simplification spec
const operatorCategories: CategoryDefinition[] = [
  {
    id: 'common',
    label: 'Common',
    icon: '⭐',
    color: 'operators',
    operators: [
      {
        type: 'fetch-json',
        label: 'Fetch JSON',
        icon: '🌐',
        description: 'Fetch and parse JSON data from a URL',
        defaultConfig: { url: 'https://jsonplaceholder.typicode.com/posts' },
      },
      {
        type: 'filter',
        label: 'Filter',
        icon: '🔍',
        description: 'Filter items by rules (Permit/Block mode)',
        defaultConfig: { 
          mode: 'permit', 
          matchMode: 'any', 
          rules: [{ field: '', operator: 'equals', value: '' }] 
        },
      },
      {
        type: 'sort',
        label: 'Sort',
        icon: '↕️',
        description: 'Sort items by field',
        defaultConfig: { field: '', direction: 'asc' },
      },
    ],
  },
  {
    id: 'sources',
    label: 'Sources',
    icon: '📥',
    color: 'sources',
    operators: [
      {
        type: 'fetch-csv',
        label: 'Fetch CSV',
        icon: '📊',
        description: 'Fetch and parse CSV data into JSON array',
        defaultConfig: { url: '', delimiter: ',', hasHeader: true },
      },
      {
        type: 'fetch-rss',
        label: 'Fetch RSS',
        icon: '📰',
        description: 'Fetch and parse RSS/Atom feeds',
        defaultConfig: { url: '', maxItems: 50 },
      },
      {
        type: 'fetch-page',
        label: 'Fetch Page',
        icon: '🌍',
        description: 'Fetch HTML and extract data with CSS selectors',
        defaultConfig: { url: '', selector: '', multiple: true },
      },
    ],
  },
  {
    id: 'user-inputs',
    label: 'User Inputs',
    icon: '✏️',
    color: 'user-inputs',
    operators: [
      {
        type: 'text-input',
        label: 'Text Input',
        icon: '📝',
        description: 'Text parameter for the pipe',
        defaultConfig: { label: 'Text Input', defaultValue: '', required: false },
      },
      {
        type: 'number-input',
        label: 'Number Input',
        icon: '🔢',
        description: 'Numeric input with optional min/max constraints',
        defaultConfig: { label: 'Number Input', defaultValue: 0, required: false },
      },
      {
        type: 'url-input',
        label: 'URL Input',
        icon: '🔗',
        description: 'URL input with validation',
        defaultConfig: { label: 'URL Input', defaultValue: '', required: false },
      },
      {
        type: 'date-input',
        label: 'Date Input',
        icon: '📅',
        description: 'Date input parameter',
        defaultConfig: { label: 'Date Input', defaultValue: '', required: false },
      },
    ],
  },
  {
    id: 'transforms',
    label: 'Transforms',
    icon: '🔄',
    color: 'operators',
    operators: [
      {
        type: 'unique',
        label: 'Unique',
        icon: '🎯',
        description: 'Remove duplicate items based on a field',
        defaultConfig: { field: '' },
      },
      {
        type: 'truncate',
        label: 'Truncate',
        icon: '✂️',
        description: 'Keep only the first N items',
        defaultConfig: { count: 10 },
      },
      {
        type: 'tail',
        label: 'Tail',
        icon: '📋',
        description: 'Keep only the last N items',
        defaultConfig: { count: 10, skip: false },
      },
      {
        type: 'rename',
        label: 'Rename',
        icon: '🏷️',
        description: 'Rename fields in items',
        defaultConfig: { mappings: [] },
      },
      {
        type: 'transform',
        label: 'Transform',
        icon: '🔄',
        description: 'Map and reshape data fields',
        defaultConfig: { mappings: [] },
      },
      {
        type: 'pipe-output',
        label: 'Pipe Output',
        icon: '📤',
        description: 'Final output of the pipe',
        defaultConfig: {},
      },
    ],
  },
  {
    id: 'string',
    label: 'String',
    icon: '📜',
    color: 'string',
    operators: [
      {
        type: 'string-replace',
        label: 'Replace',
        icon: '🔤',
        description: 'Replace text in a field',
        defaultConfig: { field: '', search: '', replace: '', all: true },
      },
      {
        type: 'regex',
        label: 'Regex',
        icon: '🔣',
        description: 'Apply regex pattern to extract or replace content',
        defaultConfig: { field: '', pattern: '', mode: 'extract', flags: '' },
      },
      {
        type: 'substring',
        label: 'Substring',
        icon: '✂️',
        description: 'Extract portion of a string by indices',
        defaultConfig: { field: '', start: 0 },
      },
    ],
  },
  {
    id: 'url',
    label: 'URL',
    icon: '🔗',
    color: 'url',
    operators: [
      {
        type: 'url-builder',
        label: 'URL Builder',
        icon: '🏗️',
        description: 'Build URLs with query parameters',
        defaultConfig: { baseUrl: '', params: [] },
      },
    ],
  },
];

export const OperatorPalette: FC = () => {
  const dispatch = useDispatch();
  const existingNodes = useSelector((state: RootState) => state.canvas.nodes);
  
  // Responsive breakpoints for palette behavior (Requirements 11.2, 11.3, 11.4)
  // Below 1200px: Icon-only mode (Requirement 11.2)
  // Below 900px: Hidden behind toggle (Requirement 11.3)
  const isBelow900 = useMediaQuery('(max-width: 899px)');
  const isBelow1200 = useMediaQuery('(max-width: 1199px)');
  
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [draggingOperator, setDraggingOperator] = useState<string | null>(null);
  
  // Track which category is expanded (only one at a time - accordion behavior)
  // Default: null (all collapsed)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Progressive disclosure: Track if user is advanced (Requirement 15.3, 15.4, 15.5)
  const [showAdvancedOperators, setShowAdvancedOperators] = useState(isAdvancedUser());
  const [showAllToggle, setShowAllToggle] = useState(false);
  
  // Update advanced user status when component mounts or when pipes are saved
  useEffect(() => {
    const checkAdvancedStatus = () => {
      setShowAdvancedOperators(isAdvancedUser());
    };
    
    // Check on mount
    checkAdvancedStatus();
    
    // Listen for storage events (when pipes are saved)
    window.addEventListener('storage', checkAdvancedStatus);
    
    // Also check periodically in case localStorage was updated in same tab
    const interval = setInterval(checkAdvancedStatus, 1000);
    
    return () => {
      window.removeEventListener('storage', checkAdvancedStatus);
      clearInterval(interval);
    };
  }, []);

  // Auto-collapse palette below 900px (Requirement 11.3)
  useEffect(() => {
    if (isBelow900) {
      setIsPaletteCollapsed(true);
    }
  }, [isBelow900]);

  // Create custom drag preview element
  useEffect(() => {
    let previewContainer = document.getElementById('drag-preview-container');
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.id = 'drag-preview-container';
      previewContainer.style.position = 'fixed';
      previewContainer.style.pointerEvents = 'none';
      previewContainer.style.zIndex = '9999';
      previewContainer.style.top = '-1000px';
      previewContainer.style.left = '-1000px';
      document.body.appendChild(previewContainer);
    }
    return () => {
      const container = document.getElementById('drag-preview-container');
      if (container) {
        document.body.removeChild(container);
      }
    };
  }, []);

  const toggleCategory = (categoryId: string) => {
    // Accordion behavior: clicking the same category collapses it, clicking a different one switches
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement | HTMLButtonElement>, operator: OperatorDefinition) => {
    setDraggingOperator(operator.type);
    
    e.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: operator.type,
      label: operator.label,
      defaultConfig: operator.defaultConfig,
    }));
    e.dataTransfer.effectAllowed = 'move';

    // Create custom drag preview
    const preview = document.createElement('div');
    preview.className = 'drag-preview';
    preview.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%);
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(107, 76, 154, 0.4);
        color: white;
        font-weight: 600;
        font-size: 14px;
        transform: rotate(-2deg);
      ">
        <span style="font-size: 20px;">${operator.icon}</span>
        <span>${operator.label}</span>
      </div>
    `;
    preview.style.position = 'absolute';
    preview.style.top = '-1000px';
    preview.style.left = '-1000px';
    document.body.appendChild(preview);
    
    e.dataTransfer.setDragImage(preview, 50, 25);
    
    setTimeout(() => {
      document.body.removeChild(preview);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggingOperator(null);
  };

  const handleAddOperator = (operator: OperatorDefinition) => {
    dispatch(saveToHistory());

    const label = generateOperatorLabel(operator.type, existingNodes);

    const newNode = {
      id: `${operator.type}-${Date.now()}`,
      type: operator.type,
      position: { x: 250, y: 100 },
      data: {
        label,
        config: operator.defaultConfig,
      },
    };

    dispatch(addNode(newNode));
  };

  // Filter categories based on user experience level (Requirement 15.3, 15.4)
  const visibleCategories = useMemo(() => {
    if (showAdvancedOperators || showAllToggle) {
      return operatorCategories;
    }
    // Hide String and URL categories for new users
    return operatorCategories.filter(cat => cat.id !== 'string' && cat.id !== 'url');
  }, [showAdvancedOperators, showAllToggle]);
  
  // Get all operators flattened for collapsed/icon-only view
  const allOperators = visibleCategories.flatMap(cat => cat.operators);

  // Collapsed view (hidden behind toggle) - below 900px (Requirement 11.3)
  if (isPaletteCollapsed) {
    return (
      <div className="w-12 h-full bg-white border-r border-neutral-200 shadow-lg flex flex-col items-center py-4 overflow-y-auto transition-all duration-300 ease-in-out">
        <button
          onClick={() => setIsPaletteCollapsed(false)}
          className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Expand palette"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="mt-4 space-y-2">
          {allOperators.map((operator) => (
            <Tooltip key={operator.type} content={operator.label} position="right">
              <button
                onClick={() => handleAddOperator(operator)}
                className="p-2 text-xl hover:bg-neutral-100 rounded-lg transition-colors"
              >
                {operator.icon}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  // Icon-only mode - below 1200px (but above 900px) (Requirement 11.2)
  if (isBelow1200 && !isBelow900) {
    return (
      <div className="w-16 h-full bg-white border-r border-neutral-200 shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="p-2 border-b border-neutral-200 flex items-center justify-center">
          <span className="text-lg">⚙️</span>
        </div>

        {/* Operator Categories - Icon Only */}
        <div className="flex-1 overflow-y-auto p-2">
          {visibleCategories.map((category) => {
            const isCollapsed = expandedCategory !== category.id;
            
            return (
              <div key={category.id} className="mb-2">
                {/* Category Header - Icon Only */}
                <Tooltip content={category.label} position="right">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${
                      isCollapsed ? 'bg-neutral-100' : 'bg-primary-100'
                    }`}
                    aria-expanded={!isCollapsed}
                    aria-label={category.label}
                  >
                    <span className="text-lg">{category.icon}</span>
                  </button>
                </Tooltip>
                
                {/* Category Operators - Icon Only */}
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {category.operators.map((operator) => (
                      <Tooltip 
                        key={operator.type} 
                        content={operator.label}
                        position="right"
                      >
                        <button
                          onClick={() => handleAddOperator(operator)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, operator)}
                          onDragEnd={handleDragEnd}
                          className={`
                            w-full p-2 rounded-lg transition-all duration-200
                            hover:bg-neutral-100 active:scale-95
                            ${draggingOperator === operator.type ? 'opacity-50 scale-95' : ''}
                          `}
                        >
                          <span className="text-lg">{operator.icon}</span>
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full palette view - above 1200px (Requirement 11.4)
  return (
    <div className="w-[200px] h-full bg-white border-r border-neutral-200 shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Operators</h2>
        <button
          onClick={() => setIsPaletteCollapsed(true)}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
          title="Collapse palette"
          aria-label="Collapse operator palette"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Operator Categories */}
      <div className="flex-1 overflow-y-auto p-3">
        {visibleCategories.map((category) => {
          const isCollapsed = expandedCategory !== category.id;
          const colors = categoryColors[category.color];
          
          return (
            <div key={category.id} className="mb-3">
              {/* Category Header - Collapsible */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${colors.header}`}
                aria-expanded={!isCollapsed}
                aria-controls={`category-${category.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{category.icon}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {category.label}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Category Operators */}
              {!isCollapsed && (
                <div id={`category-${category.id}`} className="mt-2 space-y-1.5">
                  {category.operators.map((operator) => (
                    <Tooltip 
                      key={operator.type} 
                      content={operator.description}
                      position="right"
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, operator)}
                        onDragEnd={handleDragEnd}
                      >
                        <Card
                          variant="interactive"
                          className={`
                            cursor-grab select-none transition-all duration-200
                            ${colors.bg} ${colors.border} ${colors.hover}
                            active:scale-95 active:cursor-grabbing
                            ${draggingOperator === operator.type ? 'opacity-50 scale-95' : ''}
                          `}
                          onClick={() => handleAddOperator(operator)}
                        >
                          <div className="flex items-center gap-2.5 p-2.5">
                            <span className="text-base flex-shrink-0">{operator.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-neutral-900">
                                {operator.label}
                              </span>
                            </div>
                            <svg 
                              className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        </Card>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show All toggle for new users (Requirement 15.4) */}
      {!showAdvancedOperators && (
        <div className="p-3 border-t border-neutral-200">
          <button
            onClick={() => setShowAllToggle(!showAllToggle)}
            className="w-full px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors flex items-center justify-between"
          >
            <span>{showAllToggle ? 'Hide Advanced' : 'Show All Operators'}</span>
            <span className="text-xs text-primary-600">
              {getPipesUntilAdvanced()} more {getPipesUntilAdvanced() === 1 ? 'pipe' : 'pipes'} to unlock
            </span>
          </button>
        </div>
      )}
      
      {/* Help tip */}
      <div className="p-3 border-t border-neutral-200">
        <div className="p-2.5 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-xs text-primary-700">
            💡 <strong>Tip:</strong> Drag operators to the canvas or click to add. Connect them to build your data flow.
          </p>
        </div>
      </div>
    </div>
  );
};
