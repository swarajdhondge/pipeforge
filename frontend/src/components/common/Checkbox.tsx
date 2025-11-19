import type { FC, InputHTMLAttributes } from 'react';
import { useId } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDisabled?: boolean;
  error?: string;
}

export const Checkbox: FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  isDisabled = false,
  error,
  className = '',
  id: providedId,
  ...props
}) => {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={id}
        className={`
          inline-flex items-center gap-2 cursor-pointer
          min-h-[44px] py-2
          ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}
        `}
      >
        <div className="relative flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={isDisabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={`
              w-5 h-5 rounded border-2 transition-all duration-200
              flex items-center justify-center
              peer-focus:ring-2 peer-focus:ring-border-focus/40 peer-focus:ring-offset-1
              ${checked
                ? 'bg-accent-purple border-accent-purple'
                : 'bg-bg-surface border-border-default hover:border-accent-purple-hover'
              }
              ${error ? 'border-status-error' : ''}
            `}
          >
            {checked && (
              <svg className="w-3 h-3 text-text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        {label && <span className="text-sm text-text-secondary">{label}</span>}
      </label>
      {error && <p className="text-sm text-status-error">{error}</p>}
    </div>
  );
};
