import { type FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store/store';
import { fetchSecrets } from '../../../store/slices/secrets-slice';
import { useSchema } from '../../../hooks/use-schema';
import { ValidatedInput, ValidatedSelect } from '../../common/ValidatedInput';
import { validateFetchCSV } from '../../../utils/inline-validation';
import type { FetchCSVConfig, SecretRef } from '../../../types/operator.types';

interface FetchCSVInlineConfigProps {
  nodeId: string;
  config: FetchCSVConfig;
  onConfigChange: (config: FetchCSVConfig) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

const DELIMITER_OPTIONS = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
];

/**
 * Inline configuration component for Fetch CSV operator.
 * Displays URL input, delimiter selector, hasHeader toggle, and preview button.
 * 
 * Requirements: 2.2 - WHEN a Fetch operator is displayed THEN the System 
 * SHALL show URL input field and Preview button inline
 */
export const FetchCSVInlineConfig: FC<FetchCSVInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
  onValidationChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { secrets } = useSelector((state: RootState) => state.secrets);
  const { preview, isLoading, error } = useSchema(nodeId);
  
  const [showSecretConfig, setShowSecretConfig] = useState(!!config.secretRef);

  // Real-time validation
  const validation = useMemo(() => validateFetchCSV(config), [config]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      const errorMessages = validation.errors.map(e => e.message);
      onValidationChange(validation.isValid, errorMessages);
    }
  }, [validation, onValidationChange]);

  // Fetch secrets on mount
  useEffect(() => {
    dispatch(fetchSecrets());
  }, [dispatch]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, url: e.target.value });
  }, [config, onConfigChange]);

  const handleDelimiterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onConfigChange({ ...config, delimiter: e.target.value });
  }, [config, onConfigChange]);

  const handleHasHeaderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, hasHeader: e.target.checked });
  }, [config, onConfigChange]);

  // Preview is for schema extraction only - no success toast needed (Requirement 2.1)
  const handlePreview = useCallback(async () => {
    if (!config.url) return;
    await preview('fetch-csv', config);
    // Schema will be propagated automatically via Redux
    // Error handling is done by the useSchema hook
  }, [config, preview]);

  const handleSecretChange = useCallback((secretId: string) => {
    if (!secretId) {
      const { secretRef: _, ...rest } = config;
      onConfigChange(rest);
    } else {
      const secretRef: SecretRef = {
        secretId,
        headerName: config.secretRef?.headerName || 'Authorization',
        headerFormat: config.secretRef?.headerFormat || 'Bearer {value}',
      };
      onConfigChange({ ...config, secretRef });
    }
  }, [config, onConfigChange]);

  return (
    <div className="space-y-2 p-1 nodrag nowheel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      {/* URL Input */}
      <ValidatedInput
        type="url"
        label="URL"
        value={config.url || ''}
        onChange={handleUrlChange}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="https://example.com/data.csv"
        error={validation.fieldErrors.url}
      />

      {/* Delimiter Selector */}
      <ValidatedSelect
        label="Delimiter"
        value={config.delimiter || ','}
        onChange={handleDelimiterChange}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {DELIMITER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </ValidatedSelect>

      {/* Has Header Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${nodeId}-hasHeader`}
          checked={config.hasHeader !== false}
          onChange={handleHasHeaderChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-3 w-3 rounded border-border-default text-accent-purple focus:ring-accent-purple"
        />
        <label htmlFor={`${nodeId}-hasHeader`} className="text-xs text-text-secondary">
          First row is header
        </label>
      </div>

      {/* Preview Button */}
      <button
        onClick={(e) => { e.stopPropagation(); handlePreview(); }}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={!config.url || isLoading}
        className="w-full px-2 py-1 text-xs font-medium text-white bg-accent-blue rounded hover:bg-accent-blue-hover disabled:bg-bg-surface-secondary disabled:cursor-not-allowed flex items-center justify-center gap-1"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="text-xs text-status-error bg-status-error-light px-2 py-1 rounded border border-status-error">
          {error}
        </div>
      )}

      {/* Secret Configuration Toggle */}
      <div className="pt-1 border-t border-border-muted">
        <button
          onClick={(e) => { e.stopPropagation(); setShowSecretConfig(!showSecretConfig); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary"
        >
          <svg 
            className={`h-3 w-3 transition-transform ${showSecretConfig ? 'rotate-90' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>Authentication</span>
          {config.secretRef && (
            <span className="ml-1 px-1 py-0.5 bg-status-success-light text-status-success-dark rounded text-[10px]">
              Configured
            </span>
          )}
        </button>
      </div>

      {/* Secret Configuration */}
      {showSecretConfig && (
        <div className="space-y-2 pl-2 border-l-2 border-border-muted">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Secret
            </label>
            <select
              value={config.secretRef?.secretId || ''}
              onChange={(e) => handleSecretChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 text-xs border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
            >
              <option value="">No authentication</option>
              {secrets.map((secret) => (
                <option key={secret.id} value={secret.id}>
                  {secret.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
