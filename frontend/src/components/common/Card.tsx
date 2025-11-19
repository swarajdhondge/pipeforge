import type { FC, ReactNode, HTMLAttributes } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-bg-surface shadow-sm',
  elevated: 'bg-bg-surface-elevated shadow-md',
  outlined: 'bg-bg-surface border border-border-default',
  interactive: `
    bg-bg-surface shadow-sm cursor-pointer
    transition-all duration-200 ease-out
    hover:shadow-md hover:scale-[1.02] hover:bg-bg-surface-hover
    active:scale-[1.01]
  `,
};

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card: FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        rounded-md
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </div>
  );
};
