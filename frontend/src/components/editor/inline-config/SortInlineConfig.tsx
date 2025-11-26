import { type FC, useCallback } from 'react';
import { useUpstreamFieldPaths } from '../../../hooks/use-schema';
import type { SortConfig } from '../../../types/operator.types';

interface SortInlineConfigProps {
  nodeId: string;
  config: SortConfig;
  onConfigChange: (config: SortConfig) => void;
}

/**
 * Inline configuration component for Sort operator.
 * Displays field dropdown from upstream schema and direction toggle.
 * 
 * Requirements: 
 * - 2.4: WHEN a Sort operator is displayed THEN the System SHALL show 
 *   field dropdown and direction toggle inline
 * - 6.1: Field dropdown populated from upstream schema
 * - 6.2: Ascending/descending direction toggle
 */
export const SortInlineConfig: FC<SortInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const fieldPaths = useUpstreamFieldPaths(nodeId);
  const hasUpstreamSchema = fieldPaths.length > 0;

  // Ensure config has defaults
  const safeConfig: SortConfig = {
    field: config.field || '',
    direction: config.direction || 'asc',
  };

  const handleFieldChange = useCallback((field: string) => {
    onConfigChange({ ...safeConfig, field });
  }, [safeConfig, onConfigChange]);

  const handleDirectionChange = useCallback((e: React.MouseEvent, direction: 'asc' | 'desc') => {
    e.stopPropagation();
    onConfigChange({ ...safeConfig, direction });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {/* Field Selector */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Sort by Field
        </label>
        {hasUpstreamSchema ? (
          <select
            value={safeConfig.field}
            onChange={(e) => handleFieldChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
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
            placeholder="e.g., date, price, title"
            className="w-full px-2 py-1 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
        )}
      </div>

      {/* Direction Toggle */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Direction
        </label>
        <div className="flex rounded overflow-hidden border border-border-default">
          <button
            type="button"
            onClick={(e) => handleDirectionChange(e, 'asc')}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              safeConfig.direction === 'asc'
                ? 'bg-accent-purple text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Ascending
          </button>
          <button
            type="button"
            onClick={(e) => handleDirectionChange(e, 'desc')}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              safeConfig.direction === 'desc'
                ? 'bg-accent-purple text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Descending
          </button>
        </div>
      </div>

      {/* Schema Status */}
      {!hasUpstreamSchema && (
        <div className="text-[10px] text-text-tertiary bg-bg-surface-secondary px-2 py-1 rounded">
          Connect to a source operator to enable field dropdown.
        </div>
      )}
    </div>
  );
};
