import type { FC } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

/**
 * UnknownOperatorNode - Placeholder for unknown operator types
 * Requirement 19.5: Show placeholder node with "Unknown operator" message
 */
export const UnknownOperatorNode: FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-white shadow-md
        ${selected ? 'border-red-500 ring-2 ring-red-200' : 'border-red-300'}
        min-w-[200px]
      `}
    >
      {/* Input handle */}
      <Handle type="target" position={Position.Left} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <div className="font-semibold text-red-700 text-sm">Unknown Operator</div>
          <div className="text-xs text-red-600">{data.type || 'Unknown type'}</div>
        </div>
      </div>

      {/* Message */}
      <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
        This operator type is not recognized by the current version of the application.
        It may have been created with a newer version or a custom operator that is no longer available.
      </div>

      {/* Label */}
      {data.label && (
        <div className="text-xs text-gray-600 font-medium truncate">
          {data.label}
        </div>
      )}

      {/* Output handle */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
