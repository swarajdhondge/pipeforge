import { type FC, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import type { URLBuilderConfig } from '../../../types/operator.types';
import { ValidatedInput } from '../../common/ValidatedInput';
import { validateURLBuilder } from '../../../utils/inline-validation';

interface URLBuilderInlineConfigProps {
  nodeId: string;
  config: URLBuilderConfig;
  onConfigChange: (config: URLBuilderConfig) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

/**
 * Inline configuration component for URL Builder operator.
 * Displays base URL input, params list with key/value inputs, and wire from input selector.
 * 
 * Requirements: 8.1 - WHEN a user adds a URL Builder operator THEN the System 
 * SHALL provide base URL input and parameter key/value pairs
 */
export const URLBuilderInlineConfig: FC<URLBuilderInlineConfigProps> = ({
  nodeId: _nodeId,
  config,
  onConfigChange,
  onValidationChange,
}) => {
  // Get all user input nodes from the canvas for wiring
  const nodes = useSelector((state: RootState) => state.canvas.nodes);
  const userInputNodes = nodes.filter((node) => 
    ['text-input', 'number-input', 'url-input', 'date-input'].includes(node.type || '')
  );

  const safeConfig: URLBuilderConfig = {
    baseUrl: config.baseUrl || '',
    params: config.params || [],
  };

  // Real-time validation
  const validation = useMemo(() => validateURLBuilder(safeConfig), [safeConfig]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const errorMessages = validation.errors.map(e => e.message);
      onValidationChange(validation.isValid, errorMessages);
    }
  }, [validation, onValidationChange]);

  const handleBaseUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...safeConfig, baseUrl: e.target.value });
  }, [safeConfig, onConfigChange]);

  const handleAddParam = useCallback(() => {
    const newParam = { key: '', value: '', fromInput: undefined };
    onConfigChange({ ...safeConfig, params: [...safeConfig.params, newParam] });
  }, [safeConfig, onConfigChange]);

  const handleRemoveParam = useCallback((index: number) => {
    const newParams = safeConfig.params.filter((_, i) => i !== index);
    onConfigChange({ ...safeConfig, params: newParams });
  }, [safeConfig, onConfigChange]);

  const handleParamChange = useCallback((
    index: number, 
    field: 'key' | 'value' | 'fromInput', 
    value: string | undefined
  ) => {
    const newParams = safeConfig.params.map((param, i) => {
      if (i === index) {
        if (field === 'fromInput') {
          // When wiring from input, clear the static value
          return { ...param, fromInput: value || undefined, value: value ? '' : param.value };
        }
        return { ...param, [field]: value };
      }
      return param;
    });
    onConfigChange({ ...safeConfig, params: newParams });
  }, [safeConfig, onConfigChange]);

  // Build preview URL
  const buildPreviewUrl = (): string => {
    try {
      if (!safeConfig.baseUrl) return '';
      const url = new URL(safeConfig.baseUrl);
      for (const param of safeConfig.params) {
        if (param.key) {
          const value = param.fromInput 
            ? `{${userInputNodes.find(n => n.id === param.fromInput)?.data?.label || 'input'}}`
            : param.value;
          url.searchParams.set(param.key, value);
        }
      }
      return url.toString();
    } catch {
      return safeConfig.baseUrl;
    }
  };

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {/* Base URL Input */}
      <ValidatedInput
        type="url"
        label="Base URL"
        value={safeConfig.baseUrl}
        onChange={handleBaseUrlChange}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="https://api.example.com/search"
        error={validation.fieldErrors.baseUrl}
      />

      {/* Parameters List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">Query Parameters</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleAddParam(); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-xs text-accent-purple hover:text-accent-purple-hover font-medium"
          >
            + Add Param
          </button>
        </div>

        {safeConfig.params.length === 0 ? (
          <div className="text-xs text-text-quaternary italic py-1">
            No parameters. Add parameters to build query string.
          </div>
        ) : (
          <div className="space-y-1">
            {safeConfig.params.map((param, index) => (
              <div key={index} className="bg-bg-surface-secondary p-1 rounded space-y-1">
                <div className="flex items-center gap-1">
                  {/* Key Input */}
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="key"
                    className="flex-1 min-w-0 px-1 py-0.5 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
                  />

                  <span className="text-text-quaternary text-xs">=</span>

                  {/* Value Input or Wire Selector */}
                  {param.fromInput ? (
                    <div className="flex-1 min-w-0 px-1 py-0.5 text-xs bg-accent-purple-light border border-accent-purple-muted rounded text-accent-purple-dark">
                      {userInputNodes.find(n => n.id === param.fromInput)?.data?.label || 'Input'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="value"
                      className="flex-1 min-w-0 px-1 py-0.5 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
                    />
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveParam(index); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-0.5 text-text-quaternary hover:text-status-error"
                    title="Remove parameter"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Wire from Input Selector */}
                {userInputNodes.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-tertiary">Wire from:</span>
                    <select
                      value={param.fromInput || ''}
                      onChange={(e) => handleParamChange(index, 'fromInput', e.target.value || undefined)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex-1 px-1 py-0.5 text-[10px] border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
                    >
                      <option value="">Static value</option>
                      {userInputNodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.data?.label || node.type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL Preview */}
      {safeConfig.baseUrl && (
        <div className="pt-1 border-t border-border-default">
          <span className="text-[10px] font-medium text-text-tertiary">Preview:</span>
          <div className="text-[10px] text-text-secondary bg-bg-surface-secondary px-2 py-1 rounded mt-0.5 break-all font-mono">
            {buildPreviewUrl()}
          </div>
        </div>
      )}
    </div>
  );
};
