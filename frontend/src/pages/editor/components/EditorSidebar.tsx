import { type FC, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addNode } from '../../../store/slices/canvas-slice';
import { useMediaQuery } from '../../../hooks/use-media-query';

// Operator categories with accordion
const operatorCategories = [
  {
    name: 'Sources',
    operators: [
      { type: 'fetch-json', label: 'Fetch JSON', icon: '📄' },
      { type: 'fetch-csv', label: 'Fetch CSV', icon: '📊' },
      { type: 'fetch-rss', label: 'Fetch RSS', icon: '📡' },
      { type: 'fetch-page', label: 'Fetch Page', icon: '🌐' },
    ],
  },
  {
    name: 'User Inputs',
    operators: [
      { type: 'text-input', label: 'Text Input', icon: '📝' },
      { type: 'number-input', label: 'Number Input', icon: '🔢' },
      { type: 'url-input', label: 'URL Input', icon: '🔗' },
      { type: 'date-input', label: 'Date Input', icon: '📅' },
    ],
  },
  {
    name: 'Operators',
    operators: [
      { type: 'filter', label: 'Filter', icon: '🔍' },
      { type: 'sort', label: 'Sort', icon: '↕️' },
      { type: 'transform', label: 'Transform', icon: '🔄' },
      { type: 'unique', label: 'Unique', icon: '✨' },
      { type: 'truncate', label: 'Truncate', icon: '✂️' },
      { type: 'tail', label: 'Tail', icon: '⬇️' },
      { type: 'rename', label: 'Rename', icon: '✏️' },
    ],
  },
  {
    name: 'String',
    operators: [
      { type: 'string-replace', label: 'Replace', icon: '🔤' },
      { type: 'regex', label: 'Regex', icon: '🔠' },
      { type: 'substring', label: 'Substring', icon: '✂️' },
    ],
  },
  {
    name: 'URL',
    operators: [
      { type: 'url-builder', label: 'URL Builder', icon: '🔗' },
    ],
  },
];

/**
 * EditorSidebar - Operator palette with categories
 * Requirements: 1.1, 6.1, 6.2
 * 
 * 200px width, collapsible to 48px
 * Operator categories with accordion
 * Responsive behavior:
 * - < 1200px: Auto-collapse to icon-only (48px)
 * - < 900px: Hide completely with toggle button
 */
export const EditorSidebar: FC = () => {
  const dispatch = useDispatch();
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Sources');
  
  // Responsive breakpoints (Requirements 6.1, 6.2)
  const isLargeScreen = useMediaQuery('(min-width: 1200px)');
  const isMediumScreen = useMediaQuery('(min-width: 900px)');
  
  // Determine sidebar state based on viewport and manual toggle
  // Requirements 6.1: < 1200px = icon-only (48px)
  // Requirements 6.2: < 900px = hidden
  const isCollapsed = !isLargeScreen || isManuallyCollapsed;
  const isHidden = !isMediumScreen;
  
  // Reset manual collapse when screen becomes large
  useEffect(() => {
    if (isLargeScreen) {
      setIsManuallyCollapsed(false);
    }
  }, [isLargeScreen]);
  
  const handleAddOperator = (type: string, label: string) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: 100 },
      data: {
        label,
        config: {},
      },
    };
    dispatch(addNode(newNode));
  };
  
  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };
  
  return (
    <div 
      className={`bg-bg-surface border-r border-border-default flex-shrink-0 transition-all duration-300 ${
        isHidden ? 'w-0 border-r-0' : isCollapsed ? 'w-12' : 'w-50'
      }`}
    >
      {!isHidden && (
        <>
          {/* Collapse/Expand button */}
          <div className="h-12 border-b border-border-default flex items-center justify-between px-3">
            {!isCollapsed && (
              <span className="text-sm font-semibold text-text-primary">Operators</span>
            )}
            {/* Only show toggle on large screens (Requirements 6.1) */}
            {isLargeScreen && (
              <button
                onClick={() => setIsManuallyCollapsed(!isManuallyCollapsed)}
                className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded transition-colors"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} 
                  />
                </svg>
              </button>
            )}
          </div>
      
      {/* Operator categories */}
      {!isCollapsed && (
        <div className="overflow-y-auto h-[calc(100%-3rem)]">
          {operatorCategories.map((category) => (
            <div key={category.name} className="border-b border-border-default">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-bg-surface-hover transition-colors"
              >
                <span className="text-sm font-medium text-text-primary">
                  {category.name}
                </span>
                <svg 
                  className={`w-4 h-4 text-text-secondary transition-transform ${
                    expandedCategory === category.name ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              </button>
              
              {/* Category operators */}
              {expandedCategory === category.name && (
                <div className="bg-bg-surface-secondary">
                  {category.operators.map((operator) => (
                    <button
                      key={operator.type}
                      onClick={() => handleAddOperator(operator.type, operator.label)}
                      className="w-full px-4 py-2 flex items-center gap-2 text-left hover:bg-bg-surface-hover transition-colors"
                    >
                      <span className="text-lg">{operator.icon}</span>
                      <span className="text-sm text-text-secondary">{operator.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
          {/* Collapsed state - show icons only */}
          {isCollapsed && (
            <div className="flex flex-col items-center py-2 gap-2">
              {operatorCategories.map((category) => (
                <button
                  key={category.name}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded transition-colors"
                  title={category.name}
                >
                  <span className="text-lg">{category.operators[0].icon}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
