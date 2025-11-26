import { type FC } from 'react';

interface EmptyCanvasOverlayProps {
  isVisible: boolean;
}

/**
 * Empty canvas overlay component that shows onboarding text
 * when the canvas has no operators.
 * Requirement 20.8: Show helpful onboarding text on empty canvas
 */
export const EmptyCanvasOverlay: FC<EmptyCanvasOverlayProps> = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-center max-w-md px-6">
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-purple-light text-accent-purple">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
        </div>

        {/* Main text */}
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Start Building Your Pipe
        </h3>
        
        {/* Instruction text - Requirement 20.8 */}
        <p className="text-text-secondary mb-4">
          Drag operators from the palette to get started
        </p>

        {/* Additional hints */}
        <div className="space-y-2 text-sm text-text-tertiary">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">📥</span>
            <span>Add a <strong className="text-text-secondary">Source</strong> to fetch data</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">⚙️</span>
            <span>Use <strong className="text-text-secondary">Operators</strong> to transform it</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">📤</span>
            <span>Connect to <strong className="text-text-secondary">Pipe Output</strong> to finish</span>
          </div>
        </div>

        {/* Visual arrow pointing to palette */}
        <div className="mt-6 flex items-center justify-center text-text-tertiary">
          <svg
            className="w-6 h-6 animate-bounce-horizontal"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="ml-2 text-sm">Operator Palette</span>
        </div>
      </div>
    </div>
  );
};
