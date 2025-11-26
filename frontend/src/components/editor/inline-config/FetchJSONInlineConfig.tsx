import { type FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store/store';
import { fetchSecrets } from '../../../store/slices/secrets-slice';
import { useSchema } from '../../../hooks/use-schema';
import { ValidatedInput } from '../../common/ValidatedInput';
import { validateFetchJSON } from '../../../utils/inline-validation';
import { convertUrl } from '../../../utils/url-converter';
import type { FetchJSONConfig, SecretRef } from '../../../types/operator.types';

interface FetchJSONInlineConfigProps {
  nodeId: string;
  config: FetchJSONConfig;
  onConfigChange: (config: FetchJSONConfig) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

/**
 * Inline configuration component for Fetch JSON operator.
 * Displays URL input, preview button, error display, and secret selector.
 * 
 * Requirements: 2.2 - WHEN a Fetch operator is displayed THEN the System 
 * SHALL show URL input field and Preview button inline
 */
export const FetchJSONInlineConfig: FC<FetchJSONInlineConfigProps> = ({
  nodeId,
  config,
  onConfigChange,
  onValidationChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { secrets } = useSelector((state: RootState) => state.secrets);
  const { preview, isLoading, error } = useSchema(nodeId);
  
  const [showSecretConfig, setShowSecretConfig] = useState(!!config.secretRef);
  const [urlConversionHint, setUrlConversionHint] = useState<string>('');

  // Real-time validation
  const validation = useMemo(() => validateFetchJSON(config), [config]);

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
    const inputUrl = e.target.value;
    const conversion = convertUrl(inputUrl);
    
    // If URL was converted, show hint and use converted URL
    if (conversion.wasConverted && conversion.fetchType === 'json') {
      setUrlConversionHint(conversion.hint);
      onConfigChange({ ...config, url: conversion.convertedUrl });
    } else {
      setUrlConversionHint('');
      onConfigChange({ ...config, url: inputUrl });
    }
  }, [config, onConfigChange]);

  // Preview is for schema extraction only - no success toast needed (Requirement 2.1)
  const handlePreview = useCallback(async () => {
    if (!config.url) return;
    await preview('fetch-json', config);
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

  const handleHeaderNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config.secretRef) return;
    onConfigChange({
      ...config,
      secretRef: { ...config.secretRef, headerName: e.target.value },
    });
  }, [config, onConfigChange]);

  const handleHeaderFormatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config.secretRef) return;
    onConfigChange({
      ...config,
      secretRef: { ...config.secretRef, headerFormat: e.target.value },
    });
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
        placeholder="Paste any URL (Reddit, GitHub, DEV.to...)"
        error={validation.fieldErrors.url}
      />
      
      {/* URL Conversion Hint */}
      {urlConversionHint && (
        <div className="text-xs text-status-success bg-status-success-light px-2 py-1 rounded border border-status-success">
          {urlConversionHint}
        </div>
      )}

      {/* Preview Button */}
      <button
        onClick={(e) => { e.stopPropagation(); handlePreview(); }}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={!config.url || isLoading}
        className="w-full px-2 py-1 text-xs font-medium text-white bg-secondary-500 rounded hover:bg-secondary-600 disabled:bg-border-strong disabled:text-text-tertiary disabled:cursor-not-allowed flex items-center justify-center gap-1"
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
      <div className="pt-1 border-t border-border-default">
        <button
          onClick={(e) => { e.stopPropagation(); setShowSecretConfig(!showSecretConfig); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary"
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
        <div className="space-y-2 pl-2 border-l-2 border-border-default">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Secret
            </label>
            <select
              value={config.secretRef?.secretId || ''}
              onChange={(e) => handleSecretChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
            >
              <option value="">No authentication</option>
              {secrets.map((secret) => (
                <option key={secret.id} value={secret.id}>
                  {secret.name}
                </option>
              ))}
            </select>
          </div>

          {config.secretRef && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Header Name
                </label>
                <input
                  type="text"
                  value={config.secretRef.headerName}
                  onChange={handleHeaderNameChange}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Authorization"
                  className="w-full px-2 py-1 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Header Format
                </label>
                <input
                  type="text"
                  value={config.secretRef.headerFormat || ''}
                  onChange={handleHeaderFormatChange}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Bearer {value}"
                  className="w-full px-2 py-1 text-xs border border-border-default rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-purple"
                />
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  Use {'{value}'} as placeholder for the secret
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
