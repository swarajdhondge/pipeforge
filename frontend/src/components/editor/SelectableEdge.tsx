import { useState, useMemo, type FC } from 'react';
import { BaseEdge, getBezierPath, useReactFlow, type EdgeProps } from 'reactflow';

// Pipe Forge gradient colors
const GRADIENT_START = '#6B4C9A'; // Primary purple
const GRADIENT_END = '#4A90D9';   // Secondary blue
const SELECTED_COLOR = '#FF6B35'; // Accent orange
const HOVER_COLOR = '#8B5CF6';    // Lighter purple

export const SelectableEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { setEdges } = useReactFlow();

  // Use smoother bezier curve with custom curvature
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25, // Smoother curve
  });

  // Generate unique ID for gradient (markers use global IDs from EditorCanvas)
  const gradientId = useMemo(() => `edge-gradient-${id}`, [id]);
  
  // Get marker ID based on state - uses global markers defined in EditorCanvas
  const getMarkerId = () => {
    if (selected) return 'arrow-selected';
    if (isHovered) return 'arrow-hover';
    return 'arrow-default';
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    // Context menu handled by parent
  };

  // Delete edge - can be called from context menu
  const _handleDelete = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };
  // Suppress unused variable warning - kept for future context menu implementation
  void _handleDelete;

  // Determine stroke color based on state
  const getStrokeColor = () => {
    if (selected) return SELECTED_COLOR;
    if (isHovered) return HOVER_COLOR;
    return `url(#${gradientId})`;
  };

  // Check if edge is animated (during execution)
  const isAnimated = data?.animated || false;

  return (
    <>
      {/* SVG Defs for gradient only (arrow markers are global in EditorCanvas) */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={GRADIENT_START} />
          <stop offset="100%" stopColor={GRADIENT_END} />
        </linearGradient>
      </defs>

      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={24}
        stroke="transparent"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
        style={{ cursor: 'pointer' }}
      />

      {/* Glow effect for selected/hovered state */}
      {(selected || isHovered) && (
        <path
          d={edgePath}
          fill="none"
          strokeWidth={8}
          stroke={selected ? SELECTED_COLOR : HOVER_COLOR}
          strokeOpacity={0.3}
          strokeLinecap="round"
        />
      )}

      {/* Visible edge with gradient and global arrow marker */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${getMarkerId()})`}
        style={{
          strokeWidth: isHovered || selected ? 3 : 2,
          stroke: getStrokeColor(),
          strokeLinecap: 'round',
          transition: 'stroke-width 0.2s ease',
          ...(isAnimated && {
            strokeDasharray: '8 4',
            animation: 'flowAnimation 1s linear infinite',
          }),
        }}
      />

      {/* Animated flow dots during execution */}
      {isAnimated && (
        <circle r="4" fill={GRADIENT_START}>
          <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
};
