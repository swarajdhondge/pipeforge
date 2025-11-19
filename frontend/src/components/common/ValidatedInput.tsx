/**
 * Validated Input Components
 * 
 * Reusable input components with built-in validation feedback.
 * Shows red border on invalid fields and inline error messages.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4 - Real-time validation feedback
 */

import { type FC, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

interface ValidatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helpText?: string;
}

/**
 * Input with validation feedback
 * Shows red border when error is present
 */
export const ValidatedInput: FC<ValidatedInputProps> = ({
  error,
  label,
  helpText,
  className = '',
  id,
  ...props
}) => {
  const baseClass = 'w-full px-2 py-1 text-xs border rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1';
  const normalClass = 'border-border-default focus:ring-accent-purple focus:border-accent-purple';
  const errorClass = 'border-status-error focus:ring-status-error focus:border-status-error bg-status-error-light';
  
  const inputClass = `${baseClass} ${error ? errorClass : normalClass} ${className}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <input id={id} className={inputClass} {...props} />
      {error && (
        <p className="text-[10px] text-status-error mt-0.5 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-[10px] text-text-tertiary mt-0.5">{helpText}</p>
      )}
    </div>
  );
};

interface ValidatedSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helpText?: string;
  children: React.ReactNode;
}

/**
 * Select with validation feedback
 * Shows red border when error is present
 */
export const ValidatedSelect: FC<ValidatedSelectProps> = ({
  error,
  label,
  helpText,
  className = '',
  id,
  children,
  ...props
}) => {
  const baseClass = 'w-full px-2 py-1 text-xs border rounded bg-bg-surface text-text-primary focus:outline-none focus:ring-1';
  const normalClass = 'border-border-default focus:ring-accent-purple focus:border-accent-purple';
  const errorClass = 'border-status-error focus:ring-status-error focus:border-status-error bg-status-error-light';
  
  const selectClass = `${baseClass} ${error ? errorClass : normalClass} ${className}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <select id={id} className={selectClass} {...props}>
        {children}
      </select>
      {error && (
        <p className="text-[10px] text-status-error mt-0.5 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-[10px] text-text-tertiary mt-0.5">{helpText}</p>
      )}
    </div>
  );
};

interface ValidationSummaryProps {
  errors: string[];
  maxDisplay?: number;
}

/**
 * Validation summary component
 * Shows a list of validation errors
 */
export const ValidationSummary: FC<ValidationSummaryProps> = ({
  errors,
  maxDisplay = 3,
}) => {
  if (errors.length === 0) return null;

  const displayErrors = errors.slice(0, maxDisplay);
  const remaining = errors.length - maxDisplay;

  return (
    <div className="text-xs text-status-error bg-status-error-light px-2 py-1.5 rounded border border-status-error space-y-1">
      {displayErrors.map((error, idx) => (
        <div key={idx} className="flex items-start gap-1">
          <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      ))}
      {remaining > 0 && (
        <div className="text-[10px] text-status-error-dark">
          +{remaining} more error{remaining > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
