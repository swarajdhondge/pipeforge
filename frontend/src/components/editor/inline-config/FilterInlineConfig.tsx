import { type FC, useCallback } from 'react';
import { useUpstreamFieldPaths } from '../../../hooks/use-schema';
import type { EnhancedFilterConfig, FilterRule, FilterOperatorType } from '../../../types/operator.types';

interface FilterInlineConfigProps {
  nodeId: string;
  config: EnhancedFilterConfig;
  onConfigChange: (config: EnhancedFilterConfig) => void;
}

const FILTER_OPERATORS: { value: FilterOperatorType; label: string }[] = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: '!contains' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'matches_regex', label: 'regex' },
];

/**
 * Inline configuration component for Filter operator.
 * Displays Permit/Block toggle, Any/All toggle, and rules list with field dropdowns.
 * 
 * Requirements: 
 * - 2.3: WHEN a Filter operator is displayed THEN the System SHALL show 
 *   Permit/Block toggle, match mode (any/all), and rules list inline
 * - 5.1: Permit/Block toggle (Permit = include matching, Block = exclude matching)
 * - 5.2: "any/all" toggle for rule matching (any = OR logic, all = AND logic)
 * - 5.3: Field dropdown populated from upstream schema
 */
export const FilterInlineConfig: FC<FilterInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const fieldPaths = useUpstreamFieldPaths(nodeId);
  const hasUpstreamSchema = fieldPaths.length > 0;

  // Ensure config has defaults
  const safeConfig: EnhancedFilterConfig = {
    mode: config.mode || 'permit',
    matchMode: config.matchMode || 'all',
    rules: config.rules || [],
  };

  const handleModeChange = useCallback((e: React.MouseEvent, mode: 'permit' | 'block') => {
    e.stopPropagation();
    onConfigChange({ ...safeConfig, mode });
  }, [safeConfig, onConfigChange]);

  const handleMatchModeChange = useCallback((e: React.MouseEvent, matchMode: 'any' | 'all') => {
    e.stopPropagation();
    onConfigChange({ ...safeConfig, matchMode });
  }, [safeConfig, onConfigChange]);

  const handleAddRule = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newRule: FilterRule = {
      field: fieldPaths[0] || '',
      operator: 'equals',
      value: '',
    };
    onConfigChange({ ...safeConfig, rules: [...safeConfig.rules, newRule] });
  }, [safeConfig, fieldPaths, onConfigChange]);

  const handleRemoveRule = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newRules = safeConfig.rules.filter((_, i) => i !== index);
    onConfigChange({ ...safeConfig, rules: newRules });
  }, [safeConfig, onConfigChange]);

  const handleRuleChange = useCallback((index: number, field: keyof FilterRule, value: unknown) => {
    const newRules = safeConfig.rules.map((rule, i) => {
      if (i === index) {
        return { ...rule, [field]: value };
      }
      return rule;
    });
    onConfigChange({ ...safeConfig, rules: newRules });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {/* Mode Toggle: Permit/Block */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary">Mode:</span>
        <div className="flex rounded overflow-hidden border border-border-default">
          <button
            type="button"
            onClick={(e) => handleModeChange(e, 'permit')}
            onMouseDown={(e) => e.stopPropagation()}
            className={`px-2 py-0.5 text-xs font-medium transition-colors ${
              safeConfig.mode === 'permit'
                ? 'bg-status-success text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            Permit
          </button>
          <button
            type="button"
            onClick={(e) => handleModeChange(e, 'block')}
            onMouseDown={(e) => e.stopPropagation()}
            className={`px-2 py-0.5 text-xs font-medium transition-colors ${
              safeConfig.mode === 'block'
                ? 'bg-status-error text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            Block
          </button>
        </div>
      </div>

      {/* Match Mode Toggle: Any/All */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary">Match:</span>
        <div className="flex rounded overflow-hidden border border-border-default">
          <button
            type="button"
            onClick={(e) => handleMatchModeChange(e, 'all')}
            onMouseDown={(e) => e.stopPropagation()}
            className={`px-2 py-0.5 text-xs font-medium transition-colors ${
              safeConfig.matchMode === 'all'
                ? 'bg-accent-purple text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            All (AND)
          </button>
          <button
            type="button"
            onClick={(e) => handleMatchModeChange(e, 'any')}
            onMouseDown={(e) => e.stopPropagation()}
            className={`px-2 py-0.5 text-xs font-medium transition-colors ${
              safeConfig.matchMode === 'any'
                ? 'bg-accent-purple text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            Any (OR)
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">Rules</span>
          <button
            type="button"
            onClick={handleAddRule}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-xs text-text-link hover:text-accent-purple font-medium"
          >
            + Add Rule
          </button>
        </div>

        {safeConfig.rules.length === 0 ? (
          <div className="text-xs text-text-tertiary italic py-1">
            No rules defined. Add a rule to filter items.
          </div>
        ) : (
          <div className="space-y-1">
            {safeConfig.rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-1 bg-bg-surface-secondary p-1 rounded">
                {/* Field Selector */}
                {hasUpstreamSchema ? (
                  <select
                    value={rule.field}
                    onChange={(e) => handleRuleChange(index, 'field', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 px-1 py-0.5 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
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
                    value={rule.field}
                    onChange={(e) => handleRuleChange(index, 'field', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="e.g., title, status"
                    className="flex-1 min-w-0 px-1 py-0.5 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
                  />
                )}

                {/* Operator Selector */}
                <select
                  value={rule.operator}
                  onChange={(e) => handleRuleChange(index, 'operator', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-16 px-1 py-0.5 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
                >
                  {FILTER_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {/* Value Input */}
                <input
                  type="text"
                  value={String(rule.value ?? '')}
                  onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="e.g., active, 100"
                  className="flex-1 min-w-0 px-1 py-0.5 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
                />

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveRule(e, index)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-0.5 text-text-tertiary hover:text-status-error"
                  title="Remove rule"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schema Status */}
      {!hasUpstreamSchema && (
        <div className="text-[10px] text-text-tertiary bg-bg-surface-secondary px-2 py-1 rounded">
          Connect to a source operator to enable field dropdowns.
        </div>
      )}
    </div>
  );
};
