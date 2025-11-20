import { useEffect, type FC, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearError } from '../../store/slices/auth-slice';
import { useTheme } from '../../hooks/use-theme';
import { Tooltip } from '../common/Tooltip';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Layout component for auth pages (login, register, forgot-password, reset-password).
 * Provides:
 * - Consistent header with logo and back-to-home navigation
 * - Theme toggle
 * - Automatic clearing of auth errors when the page mounts
 */
export const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { resolvedTheme, toggleTheme } = useTheme();

  // Clear any existing auth errors when component mounts
  // This prevents stale errors from showing when navigating between auth pages
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg-app flex flex-col">
      {/* Header with navigation */}
      <header className="bg-pipe-forge">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo and home link */}
            <Link 
              to="/" 
              className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
            >
              {/* Logo Icon */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="auth-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="100%" stopColor="#E0E7FF" />
                  </linearGradient>
                </defs>
                <circle cx="6" cy="12" r="3.5" fill="url(#auth-logo-gradient)" />
                <circle cx="18" cy="12" r="3.5" fill="url(#auth-logo-gradient)" />
                <path d="M9.5 12h5M12.5 9.5l2 2.5-2 2.5" stroke="url(#auth-logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-lg font-bold">Pipe Forge</span>
            </Link>

            {/* Right side: back to home and theme toggle */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/90 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Home</span>
              </Link>

              {/* Theme toggle */}
              <Tooltip content={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`} position="bottom">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === 'light' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-text-tertiary">
        <p>
          © {new Date().getFullYear()} Pipe Forge. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
