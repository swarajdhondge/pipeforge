import { type FC, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../store/store';
import { addNode, saveToHistory } from '../../../store/slices/canvas-slice';
import { useBreakpoint } from '../../../hooks/use-media-query';

// Operator categories
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
    operators: [{ type: 'url-builder', label: 'URL Builder', icon: '🔗' }],
  },
  {
    name: 'Output',
    operators: [{ type: 'pipe-output', label: 'Pipe Output', icon: '📤' }],
  },
];

// Node dimensions for positioning
const NODE_WIDTH = 280;
const NODE_HEIGHT = 200;
const NODE_PADDING = 20;

const calculateNonOverlappingPosition = (
  existingNodes: Array<{ position: { x: number; y: number } }>,
  isMobile: boolean
): { x: number; y: number } => {
  // On mobile, position nodes more to the left since sidebar is hidden
  const baseX = isMobile ? 50 : 300;
  const baseY = 100;
  if (existingNodes.length === 0) return { x: baseX, y: baseY };
  const nodesPerRow = isMobile ? 2 : 3;
  const nodeIndex = existingNodes.length;
  const row = Math.floor(nodeIndex / nodesPerRow);
  const col = nodeIndex % nodesPerRow;
  return {
    x: baseX + col * (NODE_WIDTH + NODE_PADDING),
    y: baseY + row * (NODE_HEIGHT + NODE_PADDING),
  };
};

interface OperatorsSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * OperatorsSidebar - Left sidebar with operator palette
 * 
 * On mobile: Displays as a slide-out drawer with overlay
 * On desktop: Displays as a fixed sidebar
 */
export const OperatorsSidebar: FC<OperatorsSidebarProps> = ({ isOpen: controlledIsOpen, onToggle }) => {
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.canvas.nodes);
  const [expandedCategory, setExpandedCategory] = useState<string>('Sources');
  const { isMobile } = useBreakpoint();
  
  // Internal state for uncontrolled mode
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled or uncontrolled state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = onToggle || (() => setInternalIsOpen(!internalIsOpen));

  // Close sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile && internalIsOpen) {
      setInternalIsOpen(false);
    }
  }, [isMobile, internalIsOpen]);

  const handleAddOperator = (type: string, label: string) => {
    dispatch(saveToHistory());
    const position = calculateNonOverlappingPosition(nodes, isMobile);
    dispatch(addNode({
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label, config: {} },
    }));
    
    // Close sidebar on mobile after adding operator
    if (isMobile) {
      handleToggle();
    }
  };

  // Sidebar content (shared between mobile drawer and desktop sidebar)
  const sidebarContent = (
    <>
      <div className="p-3 border-b border-border-default flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Operators</h2>
        {isMobile && (
          <button
            onClick={handleToggle}
            className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover rounded"
            aria-label="Close operators panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="py-1 flex-1 overflow-y-auto">
        {operatorCategories.map((category) => (
          <div key={category.name}>
            <button
              onClick={() => setExpandedCategory(expandedCategory === category.name ? '' : category.name)}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-bg-surface-hover"
            >
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">{category.name}</span>
              <svg 
                className={`w-4 h-4 text-text-tertiary transition-transform ${expandedCategory === category.name ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedCategory === category.name && (
              <div className="pb-2">
                {category.operators.map((op) => (
                  <button
                    key={op.type}
                    onClick={() => handleAddOperator(op.type, op.label)}
                    className="w-full px-4 py-1.5 flex items-center gap-2 text-left hover:bg-bg-surface-hover group"
                  >
                    <span className="text-sm">{op.icon}</span>
                    <span className="text-sm text-text-primary flex-1">{op.label}</span>
                    <span className="w-5 h-5 flex items-center justify-center rounded bg-status-success-light text-status-success opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // Mobile: Render as slide-out drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button - fixed position */}
        <button
          onClick={handleToggle}
          className="fixed left-3 bottom-20 z-40 p-3 bg-pipe-forge text-white rounded-full shadow-lg hover:bg-pipe-forge-hover transition-colors"
          aria-label="Toggle operators panel"
          aria-expanded={isOpen}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-bg-overlay z-40 animate-fade-in"
            onClick={handleToggle}
            aria-hidden="true"
          />
        )}

        {/* Slide-out drawer */}
        <div
          className={`
            fixed top-12 left-0 bottom-0 w-64 bg-bg-surface z-50 shadow-xl
            transform transition-transform duration-300 ease-in-out
            flex flex-col border-r border-border-default
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          role="dialog"
          aria-modal="true"
          aria-label="Operators panel"
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <div className="w-56 bg-bg-surface border-r border-border-default flex-shrink-0 flex flex-col overflow-hidden">
      {sidebarContent}
    </div>
  );
};
