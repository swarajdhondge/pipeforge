import { type FC, useCallback } from 'react';
import { useUpstreamFieldPaths } from '../../../hooks/use-schema';
import type { 
  StringReplaceConfig, 
  RegexConfig, 
  SubstringConfig 
} from '../../../types/operator.types';

// ============================================
// String Replace Inline Config
// ============================================

interface StringReplaceInlineConfigProps {
  nodeId: string;
  config: StringReplaceConfig;
  onConfigChange: (config: StringReplaceConfig) => void;
}

/**
 * Inline configuration component for String Replace operator.
 * Displays field selector, search string, and replacement string inputs.
 * 
 * Requirements: 9.1 - WHEN a user adds a String Replace operator THEN the System 
 * SHALL replace occurrences of a search string with a replacement string
 */
export const StringReplaceInlineConfig: FC<StringReplaceInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const fieldPaths = useUpstreamFieldPaths(nodeId);
  const hasUpstreamSchema = fieldPaths.length > 0;

  const safeConfig: StringReplaceConfig = {
    field: config.field || '',
    search: config.search || '',
    replace: config.replace || '',
    all: config.all !== false,
  };

  const handleChange = useCallback((field: keyof StringReplaceConfig, value: unknown) => {
    onConfigChange({ ...safeConfig, [field]: value });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Field
        </label>
        {hasUpstreamSchema ? (
          <select
            value={safeConfig.field}
            onChange={(e) => handleChange('field', e.target.value)}
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
            onChange={(e) => handleChange('field', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="e.g., description, title"
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Search
        </label>
        <input
          type="text"
          value={safeConfig.search}
          onChange={(e) => handleChange('search', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="e.g., old text, http://"
          className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Replace With
        </label>
        <input
          type="text"
          value={safeConfig.replace}
          onChange={(e) => handleChange('replace', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="e.g., new text, https://"
          className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${nodeId}-all`}
          checked={safeConfig.all}
          onChange={(e) => handleChange('all', e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-3 w-3 rounded border-border-default text-accent-purple focus:ring-accent-purple"
        />
        <label htmlFor={`${nodeId}-all`} className="text-xs text-text-secondary">
          Replace all occurrences
        </label>
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
// Regex Inline Config
// ============================================

interface RegexInlineConfigProps {
  nodeId: string;
  config: RegexConfig;
  onConfigChange: (config: RegexConfig) => void;
}

/**
 * Inline configuration component for Regex operator.
 * Displays field selector, pattern input, mode toggle, and replacement input.
 * 
 * Requirements: 9.2 - WHEN a user adds a Regex operator THEN the System 
 * SHALL apply a regex pattern to extract or replace content
 */
export const RegexInlineConfig: FC<RegexInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const fieldPaths = useUpstreamFieldPaths(nodeId);
  const hasUpstreamSchema = fieldPaths.length > 0;

  const safeConfig: RegexConfig = {
    field: config.field || '',
    pattern: config.pattern || '',
    flags: config.flags || '',
    mode: config.mode || 'extract',
    replacement: config.replacement,
    group: config.group,
  };

  const handleChange = useCallback((field: keyof RegexConfig, value: unknown) => {
    onConfigChange({ ...safeConfig, [field]: value });
  }, [safeConfig, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Field
        </label>
        {hasUpstreamSchema ? (
          <select
            value={safeConfig.field}
            onChange={(e) => handleChange('field', e.target.value)}
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
            onChange={(e) => handleChange('field', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="e.g., email, url, text"
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Pattern
        </label>
        <input
          type="text"
          value={safeConfig.pattern}
          onChange={(e) => handleChange('pattern', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="e.g., \d{3}-\d{4}, [A-Z]+@.+"
          className="w-full px-2 py-1 text-xs font-mono border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Flags
        </label>
        <input
          type="text"
          value={safeConfig.flags || ''}
          onChange={(e) => handleChange('flags', e.target.value || undefined)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="e.g., gi, i, g"
          className="w-full px-2 py-1 text-xs font-mono border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
        />
        <p className="text-[10px] text-text-quaternary mt-0.5">
          g = global, i = case-insensitive, m = multiline
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Mode
        </label>
        <div className="flex rounded overflow-hidden border border-border-default">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleChange('mode', 'extract'); }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
              safeConfig.mode === 'extract'
                ? 'bg-accent-purple text-text-inverse'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            Extract
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleChange('mode', 'replace'); }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
              safeConfig.mode === 'replace'
                ? 'bg-accent-purple text-text-inverse'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface-hover'
            }`}
          >
            Replace
          </button>
        </div>
      </div>

      {safeConfig.mode === 'extract' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Capture Group
          </label>
          <input
            type="number"
            value={safeConfig.group ?? 0}
            onChange={(e) => handleChange('group', parseInt(e.target.value, 10) || 0)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            min={0}
            placeholder="0"
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
          <p className="text-[10px] text-text-quaternary mt-0.5">
            0 = full match, 1+ = capture group
          </p>
        </div>
      )}

      {safeConfig.mode === 'replace' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Replacement
          </label>
          <input
            type="text"
            value={safeConfig.replacement || ''}
            onChange={(e) => handleChange('replacement', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="e.g., $1-$2, Matched: $&"
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
          <p className="text-[10px] text-text-quaternary mt-0.5">
            Use $1, $2, etc. for capture groups
          </p>
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

// ============================================
// Substring Inline Config
// ============================================

interface SubstringInlineConfigProps {
  nodeId: string;
  config: SubstringConfig;
  onConfigChange: (config: SubstringConfig) => void;
}

/**
 * Inline configuration component for Substring operator.
 * Displays field selector, start index, and end index inputs.
 * 
 * Requirements: 9.3 - WHEN a user adds a Substring operator THEN the System 
 * SHALL extract a portion of a string field by start/end indices
 */
export const SubstringInlineConfig: FC<SubstringInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
}) => {
  const fieldPaths = useUpstreamFieldPaths(nodeId);
  const hasUpstreamSchema = fieldPaths.length > 0;

  const safeConfig: SubstringConfig = {
    field: config.field || '',
    start: config.start ?? 0,
    end: config.end,
  };

  const handleChange = useCallback((field: keyof SubstringConfig, value: unknown) => {
    onConfigChange({ ...safeConfig, [field]: value });
  }, [safeConfig, onConfigChange]);

  const parseNumber = (value: string): number | undefined => {
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  };

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Field
        </label>
        {hasUpstreamSchema ? (
          <select
            value={safeConfig.field}
            onChange={(e) => handleChange('field', e.target.value)}
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
            onChange={(e) => handleChange('field', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="e.g., description, text"
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Start Index
          </label>
          <input
            type="number"
            value={safeConfig.start}
            onChange={(e) => handleChange('start', parseNumber(e.target.value) ?? 0)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            min={0}
            placeholder="e.g., 0, 5"
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            End Index
          </label>
          <input
            type="number"
            value={safeConfig.end ?? ''}
            onChange={(e) => handleChange('end', parseNumber(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            min={0}
            placeholder="e.g., 10, 20"
            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
          />
        </div>
      </div>

      <p className="text-[10px] text-text-quaternary">
        Extracts characters from index {safeConfig.start} to {safeConfig.end ?? 'end'}
      </p>

      {!hasUpstreamSchema && (
        <div className="text-[10px] text-text-tertiary bg-bg-surface-secondary px-2 py-1 rounded">
          Connect to a source operator to enable field dropdown.
        </div>
      )}
    </div>
  );
};
