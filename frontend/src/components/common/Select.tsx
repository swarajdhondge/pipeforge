import type { FC } from 'react';
import { useState, useRef, useEffect, useId } from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  size?: SelectSize;
  className?: string;
}

const sizeClasses: Record<SelectSize, string> = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-4',
  lg: 'h-12 text-base px-4',
};

export const Select: FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  helperText,
  isRequired = false,
  isDisabled = false,
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const selectedOption = options.find((opt) => opt.value === value);
  const hasError = !!error;


  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isDisabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const baseClasses = `
    w-full rounded-sm border transition-all duration-200 ease-out
    bg-bg-surface text-text-primary cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-offset-0
    flex items-center justify-between
  `;

  const stateClasses = hasError
    ? 'border-status-error focus:border-status-error focus:ring-status-error/40'
    : 'border-border-default focus:border-border-focus focus:ring-border-focus/40';

  const disabledClasses = isDisabled
    ? 'bg-bg-surface-inset text-text-tertiary cursor-not-allowed opacity-70'
    : '';

  return (
    <div ref={containerRef} className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
          {isRequired && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          className={`${baseClasses} ${sizeClasses[size]} ${stateClasses} ${disabledClasses}`}
        >
          <span className={selectedOption ? 'text-text-primary' : 'text-text-tertiary'}>
            {selectedOption?.label || placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-10 w-full mt-1 bg-bg-surface-elevated border border-border-default rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  px-4 py-2 cursor-pointer transition-colors text-text-primary
                  ${option.value === value ? 'bg-accent-purple-light text-accent-purple' : ''}
                  ${highlightedIndex === index && option.value !== value ? 'bg-bg-surface-hover' : ''}
                  ${option.disabled ? 'text-text-quaternary cursor-not-allowed' : 'hover:bg-bg-surface-hover'}
                `}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasError && (
        <p id={errorId} className="text-sm text-status-error" role="alert">{error}</p>
      )}
      {!hasError && helperText && (
        <p id={helperId} className="text-sm text-text-secondary">{helperText}</p>
      )}
    </div>
  );
};
