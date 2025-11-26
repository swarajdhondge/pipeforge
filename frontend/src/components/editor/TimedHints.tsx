import { useState, useEffect, useCallback, type FC } from 'react';

interface TimedHintsProps {
  // Hint for empty URL field after 3s hover (Requirement 12.1)
  showUrlHint: boolean;
  urlFieldRef?: HTMLElement | null;
  
  // Hint arrow for unconnected operator after 10s (Requirement 12.2)
  showUnconnectedHint: boolean;
  unconnectedNodePosition?: { x: number; y: number } | null;
}

export const TimedHints: FC<TimedHintsProps> = ({
  showUrlHint,
  urlFieldRef,
  showUnconnectedHint,
  unconnectedNodePosition,
}) => {
  return (
    <>
      {/* URL Field Hint - appears after 3s hover on empty URL field */}
      {showUrlHint && urlFieldRef && (
        <div
          className="absolute z-50 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs animate-fade-in"
          style={{
            top: `${urlFieldRef.getBoundingClientRect().bottom + window.scrollY + 8}px`,
            left: `${urlFieldRef.getBoundingClientRect().left + window.scrollX}px`,
          }}
        >
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Need a URL?</p>
              <p className="text-xs mt-1 opacity-90">
                Try: https://jsonplaceholder.typicode.com/posts
              </p>
            </div>
          </div>
          {/* Arrow pointing up */}
          <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-blue-600" />
        </div>
      )}

      {/* Unconnected Operator Hint - appears after 10s with unconnected operator */}
      {showUnconnectedHint && unconnectedNodePosition && (
        <div
          className="absolute z-50 pointer-events-none animate-bounce-subtle"
          style={{
            top: `${unconnectedNodePosition.y}px`,
            left: `${unconnectedNodePosition.x + 200}px`, // Position to the right of the node
          }}
        >
          {/* Arrow pointing left */}
          <div className="flex items-center gap-2">
            <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
              <p className="font-medium">Connect to Pipe Output</p>
              <p className="text-xs mt-1 opacity-90">
                Drag from the output handle →
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Hook to manage timed hints
export const useTimedHints = (nodes: any[], edges: any[]) => {
  const [showUrlHint, setShowUrlHint] = useState(false);
  const [urlFieldRef, setUrlFieldRef] = useState<HTMLElement | null>(null);
  const [urlHoverTimer, setUrlHoverTimer] = useState<number | null>(null);

  const [showUnconnectedHint, setShowUnconnectedHint] = useState(false);
  const [unconnectedNodePosition, setUnconnectedNodePosition] = useState<{ x: number; y: number } | null>(null);
  const [unconnectedTimer, setUnconnectedTimer] = useState<number | null>(null);

  // Track URL field hover (Requirement 12.1)
  const handleUrlFieldHover = useCallback((element: HTMLElement | null, isEmpty: boolean) => {
    // Clear existing timer
    if (urlHoverTimer) {
      clearTimeout(urlHoverTimer);
      setUrlHoverTimer(null);
    }

    if (element && isEmpty) {
      // Start 3-second timer
      const timer = setTimeout(() => {
        setUrlFieldRef(element);
        setShowUrlHint(true);
      }, 3000);
      setUrlHoverTimer(timer);
    } else {
      // Hide hint when not hovering or field is not empty
      setShowUrlHint(false);
      setUrlFieldRef(null);
    }
  }, [urlHoverTimer]);

  // Track unconnected operators (Requirement 12.2)
  useEffect(() => {
    // Clear existing timer
    if (unconnectedTimer) {
      clearTimeout(unconnectedTimer);
    }

    // Find unconnected operators (excluding Pipe Output)
    const connectedNodeIds = new Set(edges.map((edge: any) => edge.source));
    const unconnectedNodes = nodes.filter(
      (node: any) => 
        node.type !== 'pipe-output' && 
        !connectedNodeIds.has(node.id)
    );

    if (unconnectedNodes.length > 0) {
      // Start 10-second timer
      const timer = setTimeout(() => {
        // Show hint for the first unconnected node
        const firstUnconnected = unconnectedNodes[0];
        setUnconnectedNodePosition({
          x: firstUnconnected.position.x,
          y: firstUnconnected.position.y,
        });
        setShowUnconnectedHint(true);

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowUnconnectedHint(false);
        }, 5000);
      }, 10000);
      setUnconnectedTimer(timer);
    } else {
      // Hide hint if all operators are connected
      setShowUnconnectedHint(false);
      setUnconnectedNodePosition(null);
    }

    // Cleanup
    return () => {
      if (unconnectedTimer) {
        clearTimeout(unconnectedTimer);
      }
    };
  }, [nodes.length, edges.length]); // Re-run when nodes or edges change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (urlHoverTimer) clearTimeout(urlHoverTimer);
      if (unconnectedTimer) clearTimeout(unconnectedTimer);
    };
  }, [urlHoverTimer, unconnectedTimer]);

  return {
    showUrlHint,
    urlFieldRef,
    handleUrlFieldHover,
    showUnconnectedHint,
    unconnectedNodePosition,
  };
};
