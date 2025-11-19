import type { FC, ReactNode } from 'react';
import { NavigationBar } from './navigation-bar';
import { Footer } from './Footer';
import { EmailVerificationBannerSpacer } from './EmailVerificationBanner';

export interface PageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const PageLayout: FC<PageLayoutProps> = ({
  children,
  showFooter = true,
  maxWidth = '2xl',
  padding = true,
  className = '',
}) => {
  // Responsive padding: 16px (px-4) on mobile, 24px (px-6) on desktop
  const paddingClasses = padding ? 'px-4 md:px-6 py-4 md:py-6 lg:py-8' : '';
  
  return (
    <div className="min-h-screen flex flex-col bg-bg-app transition-colors">
      <NavigationBar />
      
      {/* Spacer for fixed navbar */}
      <div className="h-12" />
      {/* Spacer for email verification banner if visible */}
      <EmailVerificationBannerSpacer />
      
      <main
        id="main-content"
        className={`
          flex-1 mx-auto w-full
          ${maxWidthClasses[maxWidth]}
          ${paddingClasses}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
      >
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
};

/**
 * Simple content container for consistent max-width and padding
 * Responsive padding: 16px (px-4) on mobile, 24px (px-6) on desktop
 */
export const Container: FC<{
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}> = ({ children, maxWidth = '2xl', className = '' }) => {
  return (
    <div
      className={`
        mx-auto w-full px-4 md:px-6
        ${maxWidthClasses[maxWidth]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
};
