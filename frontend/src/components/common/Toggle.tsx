import type { FC } from 'react';
import { useId } from 'react';

export interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeConfig = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  },
};

export const Toggle: FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  isDisabled = false,
  size = 'md',
  className = '',
}) => {
  const id = useId();
  const config = sizeConfig[size];

  return (
    <label
      htmlFor={id}
      className={`
        inline-flex items-center gap-3 cursor-pointer
        min-h-[44px] py-2
        ${isDisabled ? 'cursor-not-allowed opacity-60' : ''}
        ${className}
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
        />
        <div
          className={`
            ${config.track} rounded-full transition-colors duration-200
            peer-focus:ring-2 peer-focus:ring-border-focus/40 peer-focus:ring-offset-1
            ${checked ? 'bg-accent-purple' : 'bg-border-strong'}
          `}
        />
        <div
          className={`
            absolute top-0.5 left-0.5 ${config.thumb}
            bg-bg-surface rounded-full shadow transition-transform duration-200
            ${checked ? config.translate : 'translate-x-0'}
          `}
        />
      </div>
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </label>
  );
};
