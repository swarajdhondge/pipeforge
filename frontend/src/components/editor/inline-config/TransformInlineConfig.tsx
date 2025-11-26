import { type FC, useCallback } from 'react';
import { useUpstreamFieldPaths } from '../../../hooks/use-schema';
import type { 
  UniqueConfig, 
  TruncateConfig, 
  TailConfig, 
  RenameConfig 
} from '../../../types/operator.types';

// ============================================
// Unique Inline Config
// ============================================

interface UniqueInlineConfigProps {
  nodeId: string;
  config: UniqueConfig;
  onConfigChange: (config: UniqueConfig) => void;
}

/**
 * Inline configuration component for Unique operator.
 * Displays field dropdown to deduplicate by.
 * 
 * Requirements: 7.1 - WHEN a user adds a Unique operator THEN the System 
 * SHALL deduplicate items based on a selected field
 */
export const UniqueInlineConfig: FC<UniqueInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const fieldPaths = useUpstreamFieldPaths(nodeId);
  const hasUpstreamSchema = fieldPaths.length > 0;

  const safeConfig: UniqueConfig = {
    field: config.field || '',
  };

  const handleFieldChange = useCallback((field: string) => {
    onConfigChange({ ...safeConfig, field });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Deduplicate by Field
        </label>
        {hasUpstreamSchema ? (
          <select
            value={safeConfig.field}
            onChange={(e) => handleFieldChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          >
            <option value="">Select field</option>
            {fieldPaths.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={safeConfig.field}
            onChange={(e) => handleFieldChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="e.g., id, email, url"
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
        )}
        <p className="text-[10px] text-text-quaternary mt-0.5">
          Keeps first occurrence of duplicate values
        </p>
      </div>

      {!hasUpstreamSchema && (
        <div className="text-[10px] text-text-tertiary bg-bg-surface-secondary px-2 py-1 rounded">
          Connect to a source operator to enable field dropdown.
        </div>
      )}
    </div>
  );
};

// ============================================
// Truncate Inline Config
// ============================================

interface TruncateInlineConfigProps {
  nodeId: string;
  config: TruncateConfig;
  onConfigChange: (config: TruncateConfig) => void;
}

/**
 * Inline configuration component for Truncate operator.
 * Displays count input for number of items to keep.
 * 
 * Requirements: 7.2 - WHEN a user adds a Truncate operator THEN the System 
 * SHALL keep only the first N items (configurable count)
 */
export const TruncateInlineConfig: FC<TruncateInlineConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const safeConfig: TruncateConfig = {
    count: config.count ?? 10,
  };

  const handleCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onConfigChange({ count: isNaN(value) || value < 1 ? 1 : value });
  }, [onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Keep First N Items
        </label>
        <input
          type="number"
          value={safeConfig.count}
          onChange={handleCountChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          min={1}
          placeholder="10"
          className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
        />
        <p className="text-[10px] text-text-quaternary mt-0.5">
          Keeps only the first {safeConfig.count} item{safeConfig.count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

// ============================================
// Tail Inline Config
// ============================================

interface TailInlineConfigProps {
  nodeId: string;
  config: TailConfig;
  onConfigChange: (config: TailConfig) => void;
}

/**
 * Inline configuration component for Tail operator.
 * Displays count input and skip toggle.
 * 
 * Requirements: 7.3 - WHEN a user adds a Tail operator THEN the System 
 * SHALL keep only the last N items or skip the first N items
 */
export const TailInlineConfig: FC<TailInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const safeConfig: TailConfig = {
    count: config.count ?? 10,
    skip: config.skip ?? false,
  };

  const handleCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onConfigChange({ ...safeConfig, count: isNaN(value) || value < 1 ? 1 : value });
  }, [safeConfig, onConfigChange]);

  const handleSkipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...safeConfig, skip: e.target.checked });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Count
        </label>
        <input
          type="number"
          value={safeConfig.count}
          onChange={handleCountChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          min={1}
          placeholder="10"
          className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${nodeId}-skip`}
          checked={safeConfig.skip || false}
          onChange={handleSkipChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-3 w-3 rounded border-border-default text-accent-purple focus:ring-accent-purple"
        />
        <label htmlFor={`${nodeId}-skip`} className="text-xs text-text-secondary">
          Skip first N instead of keeping last N
        </label>
      </div>

      <p className="text-[10px] text-text-quaternary">
        {safeConfig.skip 
          ? `Skips the first ${safeConfig.count} item${safeConfig.count !== 1 ? 's' : ''}`
          : `Keeps only the last ${safeConfig.count} item${safeConfig.count !== 1 ? 's' : ''}`
        }
      </p>
    </div>
  );
};

// ============================================
// Rename Inline Config
// ============================================

interface RenameInlineConfigProps {
  nodeId: string;
  config: RenameConfig;
  onConfigChange: (config: RenameConfig) => void;
}

/**
 * Inline configuration component for Rename operator.
 * Displays mappings list with source/target field inputs.
 * 
 * Requirements: 7.4 - WHEN a user adds a Rename operator THEN the System 
 * SHALL allow renaming fields (source field → target field name)
 */
export const RenameInlineConfig: FC<RenameInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const fieldPaths = useUpstreamFieldPaths(nodeId);
  const hasUpstreamSchema = fieldPaths.length > 0;

  const safeConfig: RenameConfig = {
    mappings: config.mappings || [],
  };

  const handleAddMapping = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMapping = { source: '', target: '' };
    onConfigChange({ mappings: [...safeConfig.mappings, newMapping] });
  }, [safeConfig, onConfigChange]);

  const handleRemoveMapping = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newMappings = safeConfig.mappings.filter((_, i) => i !== index);
    onConfigChange({ mappings: newMappings });
  }, [safeConfig, onConfigChange]);

  const handleMappingChange = useCallback((index: number, field: 'source' | 'target', value: string) => {
    const newMappings = safeConfig.mappings.map((mapping, i) => {
      if (i === index) {
        return { ...mapping, [field]: value };
      }
      return mapping;
    });
    onConfigChange({ mappings: newMappings });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">Field Mappings</span>
        <button
          type="button"
          onClick={handleAddMapping}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-xs text-accent-purple hover:text-accent-purple-hover font-medium"
        >
          + Add Mapping
        </button>
      </div>

      {safeConfig.mappings.length === 0 ? (
        <div className="text-xs text-text-quaternary italic py-1">
          No mappings defined. Add a mapping to rename fields.
        </div>
      ) : (
        <div className="space-y-1">
          {safeConfig.mappings.map((mapping, index) => (
            <div key={index} className="flex items-center gap-1 bg-bg-surface-secondary p-1 rounded">
              {/* Source Field */}
              {hasUpstreamSchema ? (
                <select
                  value={mapping.source}
                  onChange={(e) => handleMappingChange(index, 'source', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 px-1 py-0.5 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
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
                  placeholder="e.g., old_name"
                  className="flex-1 min-w-0 px-1 py-0.5 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
                />
              )}

              {/* Arrow */}
              <span className="text-text-quaternary text-xs">→</span>

              {/* Target Field */}
              <input
                type="text"
                value={mapping.target}
                onChange={(e) => handleMappingChange(index, 'target', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="e.g., new_name"
                className="flex-1 min-w-0 px-1 py-0.5 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
              />

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => handleRemoveMapping(e, index)}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-0.5 text-text-quaternary hover:text-status-error"
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

      {!hasUpstreamSchema && (
        <div className="text-[10px] text-text-tertiary bg-bg-surface-secondary px-2 py-1 rounded">
          Connect to a source operator to enable field dropdown.
        </div>
      )}
    </div>
  );
};
