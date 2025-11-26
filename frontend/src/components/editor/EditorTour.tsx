import { type FC, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../common/Button';

interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="palette"]',
    title: 'Operator Palette',
    description: 'Drag operators from here onto the canvas. Each operator performs a specific action like fetching data, filtering, sorting, or transforming.',
    position: 'right',
  },
  {
    target: '[data-tour="canvas"] .react-flow',
    title: 'Canvas',
    description: 'This is your workspace. Drop operators here and connect them by dragging from one operator\'s output to another\'s input.',
    position: 'left',
  },
  {
    target: '[data-tour="toolbar"]',
    title: 'Toolbar',
    description: 'Use these controls to undo/redo changes and save your pipe. Press Ctrl+S (or ⌘S on Mac) to quickly save.',
    position: 'bottom',
  },
];

interface EditorTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditorTour: FC<EditorTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const updateHighlight = useCallback(() => {
    if (!isOpen) return;
    
    const step = TOUR_STEPS[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
    }
  }, [currentStep, isOpen]);

  useEffect(() => {
    updateHighlight();
    
    // Update on resize
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [updateHighlight]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen || !highlightRect) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate tooltip position with viewport boundary checking
  const getTooltipStyle = (): React.CSSProperties => {
    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 240; // Increased to account for buttons and content
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeMargin = 20; // Minimum distance from viewport edges

    let left: number;
    let top: number;
    let actualPosition = step.position;

    // Check if preferred position has enough space, otherwise flip
    const spaceRight = viewportWidth - highlightRect.right - padding;
    const spaceLeft = highlightRect.left - padding;
    const spaceBottom = viewportHeight - highlightRect.bottom - padding;
    const spaceTop = highlightRect.top - padding;

    // Auto-adjust position if not enough space
    if (actualPosition === 'right' && spaceRight < tooltipWidth + safeMargin) {
      actualPosition = spaceLeft > tooltipWidth + safeMargin ? 'left' : 'bottom';
    } else if (actualPosition === 'left' && spaceLeft < tooltipWidth + safeMargin) {
      actualPosition = spaceRight > tooltipWidth + safeMargin ? 'right' : 'bottom';
    } else if (actualPosition === 'bottom' && spaceBottom < tooltipHeight + safeMargin) {
      actualPosition = spaceTop > tooltipHeight + safeMargin ? 'top' : 'right';
    } else if (actualPosition === 'top' && spaceTop < tooltipHeight + safeMargin) {
      actualPosition = spaceBottom > tooltipHeight + safeMargin ? 'bottom' : 'right';
    }

    switch (actualPosition) {
      case 'right':
        left = highlightRect.right + padding;
        top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2;
        break;
      case 'left':
        left = highlightRect.left - tooltipWidth - padding;
        top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2;
        break;
      case 'bottom':
        left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2;
        top = highlightRect.bottom + padding;
        break;
      case 'top':
        left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2;
        top = highlightRect.top - tooltipHeight - padding;
        break;
      default:
        left = viewportWidth / 2 - tooltipWidth / 2;
        top = viewportHeight / 2 - tooltipHeight / 2;
    }

    // Final clamp to ensure tooltip stays within viewport
    left = Math.max(safeMargin, Math.min(left, viewportWidth - tooltipWidth - safeMargin));
    top = Math.max(safeMargin, Math.min(top, viewportHeight - tooltipHeight - safeMargin));

    return { left, top };
  };

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Editor Tour">
      {/* Overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={highlightRect.left - 4}
              y={highlightRect.top - 4}
              width={highlightRect.width + 8}
              height={highlightRect.height + 8}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight border */}
      <div
        className="absolute border-2 border-accent-purple rounded-lg pointer-events-none animate-pulse"
        style={{
          left: highlightRect.left - 4,
          top: highlightRect.top - 4,
          width: highlightRect.width + 8,
          height: highlightRect.height + 8,
          boxShadow: '0 0 0 4px var(--accent-purple-muted)',
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute bg-bg-surface-elevated rounded-xl shadow-2xl p-5 w-80 animate-fadeIn border border-border-default"
        style={getTooltipStyle()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-accent-purple-dark bg-accent-purple-light px-2 py-1 rounded-full">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-text-quaternary hover:text-text-secondary text-sm"
            aria-label="Skip tour"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          {step.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            isDisabled={isFirstStep}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-accent-purple' : 'bg-bg-surface-secondary'
                }`}
              />
            ))}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hook to manage editor tour state
const EDITOR_TOUR_SHOWN_KEY = 'pipe_forge_editor_tour_shown';

export const useEditorTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(EDITOR_TOUR_SHOWN_KEY, 'true');
  }, []);

  const checkAndShowTour = useCallback(() => {
    // Prevent multiple checks in the same session
    if (hasChecked) return;
    setHasChecked(true);
    
    // Check localStorage synchronously first
    const hasShown = localStorage.getItem(EDITOR_TOUR_SHOWN_KEY);
    if (hasShown === 'true') {
      // Tour was already shown, don't show again
      return;
    }
    
    // Small delay to let the editor load first
    const timer = setTimeout(() => {
      // Double-check localStorage in case it changed
      const stillNotShown = localStorage.getItem(EDITOR_TOUR_SHOWN_KEY) !== 'true';
      if (stillNotShown) {
        setIsOpen(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [hasChecked]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(EDITOR_TOUR_SHOWN_KEY);
    setHasChecked(false);
  }, []);

  return { isOpen, startTour, closeTour, checkAndShowTour, resetTour };
};
