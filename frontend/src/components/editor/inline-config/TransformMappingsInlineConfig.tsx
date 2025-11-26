import { type FC, useCallback } from 'react';
import { useUpstreamFieldPaths } from '../../../hooks/use-schema';
import type { TransformConfig, TransformMapping } from '../../../types/operator.types';

interface TransformMappingsInlineConfigProps {
  nodeId: string;
  config: TransformConfig;
  onConfigChange: (config: TransformConfig) => void;
}

/**
 * Inline configuration component for Transform operator.
 * Displays field mappings with source/target inputs.
 * 
 * Requirements: Transform operator allows mapping source fields to target fields
 * with support for dot notation for nested fields.
 */
export const TransformMappingsInlineConfig: FC<TransformMappingsInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const fieldPaths = useUpstreamFieldPaths(nodeId);
  const hasUpstreamSchema = fieldPaths.length > 0;

  const safeConfig: TransformConfig = {
    mappings: config.mappings || [],
  };

  const handleAddMapping = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMapping: TransformMapping = {
      source: fieldPaths[0] || '',
      target: '',
    };
    onConfigChange({ mappings: [...safeConfig.mappings, newMapping] });
  }, [safeConfig, fieldPaths, onConfigChange]);

  const handleRemoveMapping = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newMappings = safeConfig.mappings.filter((_, i) => i !== index);
    onConfigChange({ mappings: newMappings });
  }, [safeConfig, onConfigChange]);

  const handleMappingChange = useCallback((index: number, field: keyof TransformMapping, value: string) => {
    const newMappings = safeConfig.mappings.map((mapping, i) => {
      if (i === index) {
        return { ...mapping, [field]: value };
      }
      return mapping;
    });
    onConfigChange({ mappings: newMappings });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-2 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">Field Mappings</span>
        <button
          type="button"
          onClick={handleAddMapping}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-xs text-accent-purple hover:text-accent-purple-hover font-medium"
        >
          + Add Field
        </button>
      </div>

      {safeConfig.mappings.length === 0 ? (
        <div className="text-xs text-text-quaternary italic py-1">
          No mappings defined. Add fields to extract from input data.
        </div>
      ) : (
        <div className="space-y-1.5">
          {safeConfig.mappings.map((mapping, index) => (
            <div key={index} className="flex items-center gap-1 bg-neutral-100 p-1.5 rounded">
              {/* Source Field */}
              {hasUpstreamSchema ? (
                <select
                  value={mapping.source}
                  onChange={(e) => handleMappingChange(index, 'source', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 px-1.5 py-1 text-xs border border-neutral-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Source field</option>
                  {fieldPaths.map((path) => (
                    <option key={path} value={path}>
                      {path}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={mapping.source}
                  onChange={(e) => handleMappingChange(index, 'source', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="e.g., data.name"
                  className="flex-1 min-w-0 px-1.5 py-1 text-xs border border-neutral-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              )}

              {/* Arrow */}
              <span className="text-neutral-400 text-xs px-0.5">→</span>

              {/* Target Field */}
              <input
                type="text"
                value={mapping.target}
                onChange={(e) => handleMappingChange(index, 'target', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="e.g., name"
                className="flex-1 min-w-0 px-1.5 py-1 text-xs border border-neutral-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => handleRemoveMapping(e, index)}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 text-neutral-400 hover:text-red-500 rounded hover:bg-red-50"
                title="Remove mapping"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-neutral-400">
        Map source fields to output field names. Use dot notation for nested fields (e.g., user.name).
      </p>

      {!hasUpstreamSchema && (
        <div className="text-[10px] text-text-tertiary bg-bg-surface-secondary px-2 py-1 rounded">
          Connect to a source operator to enable field dropdown.
        </div>
      )}
    </div>
  );
};
