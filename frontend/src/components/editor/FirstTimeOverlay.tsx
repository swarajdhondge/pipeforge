import { type FC, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../common/Button';

// Step type for first-time guidance (Requirement 6.1, 6.2, 6.3, 6.4)
type FirstTimeStep = 1 | 2 | 3 | 'complete';

interface StepConfig {
  title: string;
  instruction: string;
  highlight: 'palette' | 'connection' | 'run-button' | 'none';
  target?: string; // CSS selector for the element to highlight
}

// Define the 3-step guidance (Requirement 6.1, 6.2, 6.3, 6.4)
const STEPS: Record<1 | 2 | 3, StepConfig> = {
  1: {
    title: 'Add a Source',
    instruction: 'Drag "Fetch JSON" from the left panel',
    highlight: 'palette',
    target: '[data-tour="palette"]',
  },
  2: {
    title: 'Connect Nodes',
    instruction: 'Drag from the blue dot to connect operators',
    highlight: 'connection',
    target: '.react-flow__node[data-id*="pipe-output"]',
  },
  3: {
    title: 'Run Your Pipe',
    instruction: 'Click Run to see results',
    highlight: 'run-button',
    target: '[data-tour="run-button"]',
  },
};

interface FirstTimeOverlayProps {
  step: FirstTimeStep;
  onSkip: () => void;
  onDismiss: () => void;
  onNext?: () => void; // Optional manual next button
}

export const FirstTimeOverlay: FC<FirstTimeOverlayProps> = ({ step, onSkip, onDismiss, onNext }) => {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // Update highlight when step changes
  const updateHighlight = useCallback(() => {
    if (step === 'complete') return;
    
    const stepConfig = STEPS[step];
    if (!stepConfig.target) return;
    
    const element = document.querySelector(stepConfig.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
    }
  }, [step]);

  useEffect(() => {
    updateHighlight();
    
    // Update on resize
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [updateHighlight]);

  // Don't render if step is complete
  if (step === 'complete') return null;

  const stepConfig = STEPS[step];

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect) {
      // Center on screen if no highlight
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const tooltipWidth = 360;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left: number;
    let top: number;

    // Position based on highlight area
    if (stepConfig.highlight === 'palette') {
      // Position to the right of palette
      left = highlightRect.right + padding;
      top = highlightRect.top + 100;
    } else if (stepConfig.highlight === 'connection') {
      // Position above the Pipe Output node
      left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2;
      top = highlightRect.top - 200;
    } else if (stepConfig.highlight === 'run-button') {
      // Position below the run button
      left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2;
      top = highlightRect.bottom + padding;
    } else {
      // Center on screen
      left = viewportWidth / 2 - tooltipWidth / 2;
      top = viewportHeight / 2;
    }

    // Clamp to viewport
    const safeMargin = 20;
    left = Math.max(safeMargin, Math.min(left, viewportWidth - tooltipWidth - safeMargin));
    top = Math.max(safeMargin, Math.min(top, viewportHeight - 300 - safeMargin));

    return { left, top };
  };

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="First Time Guide">
      {/* Semi-transparent overlay */}
      {highlightRect ? (
        <>
          {/* Overlay with cutout for highlighted element */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <mask id="first-time-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.7)"
              mask="url(#first-time-mask)"
            />
          </svg>

          {/* Highlight border with pulsing animation */}
          <div
            className="absolute border-4 border-accent-purple rounded-xl pointer-events-none animate-pulse"
            style={{
              left: highlightRect.left - 8,
              top: highlightRect.top - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: '0 0 0 6px var(--accent-purple-muted)',
            }}
          />
        </>
      ) : (
        // Full overlay if no highlight
        <div className="absolute inset-0 bg-black bg-opacity-70" />
      )}

      {/* Guidance card */}
      <div
        className="absolute bg-bg-surface-elevated rounded-2xl shadow-2xl p-4 w-[320px] max-w-[320px] animate-fadeIn border border-border-default"
        style={getTooltipStyle()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent-purple text-text-inverse flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <span className="text-xs font-medium text-text-tertiary">
              Step {step} of 3
            </span>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {stepConfig.title}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {stepConfig.instruction}
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-accent-purple' : 'bg-bg-surface-secondary'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-text-secondary"
            >
              Don't show again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-text-tertiary"
            >
              Skip
            </Button>
          </div>
          {onNext && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNext}
            >
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hook to manage first-time overlay state (Requirement 6.6)
const FIRST_TIME_GUIDE_KEY = 'pipe_forge_first_time_guide_dismissed';

interface UseFirstTimeOverlayReturn {
  step: FirstTimeStep;
  showOverlay: boolean;
  advanceStep: () => void;
  skipGuide: () => void;
  dismissGuide: () => void;
  resetGuide: () => void;
}

export const useFirstTimeOverlay = (): UseFirstTimeOverlayReturn => {
  const [step, setStep] = useState<FirstTimeStep>(1);
  const [showOverlay, setShowOverlay] = useState(false);

  // Check if guide should be shown on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(FIRST_TIME_GUIDE_KEY);
    if (dismissed !== 'true') {
      // Small delay to let the editor load first
      const timer = setTimeout(() => {
        setShowOverlay(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Advance to next step (Requirement 6.3, 6.4, 6.5)
  const advanceStep = useCallback(() => {
    setStep((current) => {
      if (current === 1) return 2;
      if (current === 2) return 3;
      if (current === 3) {
        // Completed all steps
        setShowOverlay(false);
        localStorage.setItem(FIRST_TIME_GUIDE_KEY, 'true');
        return 'complete';
      }
      return current;
    });
  }, []);

  // Skip guide (Requirement 6.6)
  const skipGuide = useCallback(() => {
    setShowOverlay(false);
    setStep('complete');
    // Don't save to localStorage - allow showing again on next visit
  }, []);

  // Dismiss guide permanently (Requirement 6.6)
  const dismissGuide = useCallback(() => {
    setShowOverlay(false);
    setStep('complete');
    localStorage.setItem(FIRST_TIME_GUIDE_KEY, 'true');
  }, []);

  // Reset guide (for testing)
  const resetGuide = useCallback(() => {
    localStorage.removeItem(FIRST_TIME_GUIDE_KEY);
    setStep(1);
    setShowOverlay(true);
  }, []);

  return {
    step,
    showOverlay,
    advanceStep,
    skipGuide,
    dismissGuide,
    resetGuide,
  };
};
