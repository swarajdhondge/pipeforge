import type { FC, ReactNode, ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-pipe-forge text-text-inverse font-medium
    hover:bg-pipe-forge-hover
    active:bg-pipe-forge-active active:shadow-inner
    disabled:opacity-50
  `,
  secondary: `
    bg-transparent text-accent-purple border border-accent-purple
    hover:bg-accent-purple-light
    active:bg-accent-purple-muted
    disabled:opacity-50 disabled:border-border-default disabled:text-text-tertiary
  `,
  danger: `
    bg-status-error text-text-inverse font-medium
    hover:brightness-110
    active:brightness-90
    disabled:opacity-50
  `,
  ghost: `
    bg-transparent text-accent-purple
    hover:bg-bg-surface-hover
    active:bg-bg-surface-active
    disabled:opacity-50 disabled:text-text-tertiary
  `,
  link: `
    bg-transparent text-text-link underline-offset-2
    hover:underline hover:text-text-link
    active:underline
    disabled:opacity-50 disabled:text-text-tertiary
  `,
};

// Touch target sizes - minimum 44px on mobile for accessibility
// Added min-width for consistent button widths
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] sm:min-h-0 h-8 sm:h-8 px-3 text-sm rounded-md min-w-[80px]',
  md: 'min-h-[44px] sm:min-h-0 h-10 sm:h-10 px-4 text-sm rounded-md min-w-[100px]',
  lg: 'h-12 px-6 text-base rounded-md min-w-[120px]',
};


export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const disabled = isDisabled || isLoading;

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2
    disabled:cursor-not-allowed
  `;

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
