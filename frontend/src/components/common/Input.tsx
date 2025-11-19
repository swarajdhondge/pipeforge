import type { FC, InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Touch target sizes - minimum 44px on mobile for accessibility
const sizeClasses: Record<InputSize, string> = {
  sm: 'min-h-[44px] sm:min-h-0 h-8 sm:h-8 text-sm px-3',
  md: 'min-h-[44px] sm:min-h-0 h-10 sm:h-10 text-sm px-4',
  lg: 'h-12 text-base px-4',
};

const iconSizeClasses: Record<InputSize, string> = {
  sm: 'pl-8',
  md: 'pl-10',
  lg: 'pl-12',
};

const rightIconSizeClasses: Record<InputSize, string> = {
  sm: 'pr-8',
  md: 'pr-10',
  lg: 'pr-12',
};

export const Input: FC<InputProps> = ({
  size = 'md',
  label,
  helperText,
  error,
  isRequired = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  className = '',
  id: providedId,
  ...props
}) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const hasError = !!error;

  const baseInputClasses = `
    w-full rounded-sm border transition-all duration-200 ease-out
    bg-bg-surface text-text-primary placeholder-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-offset-0
  `;

  const stateClasses = hasError
    ? 'border-status-error focus:border-status-error focus:ring-status-error/40'
    : 'border-border-default focus:border-border-focus focus:ring-border-focus/40';

  const disabledClasses = isDisabled
    ? 'bg-bg-surface-inset text-text-tertiary cursor-not-allowed opacity-70'
    : '';

  const iconPaddingLeft = leftIcon ? iconSizeClasses[size] : '';
  const iconPaddingRight = rightIcon ? rightIconSizeClasses[size] : '';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
          {isRequired && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          disabled={isDisabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={`
            ${baseInputClasses}
            ${sizeClasses[size]}
            ${stateClasses}
            ${disabledClasses}
            ${iconPaddingLeft}
            ${iconPaddingRight}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>

      {hasError && (
        <p id={errorId} className="text-sm text-status-error flex items-center gap-1" role="alert">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {!hasError && helperText && (
        <p id={helperId} className="text-sm text-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
};
