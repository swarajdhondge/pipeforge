import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useBreakpoint } from '../../hooks/use-media-query';
import { useTheme } from '../../hooks/use-theme';
import { Tooltip } from './Tooltip';
import { Avatar } from './Avatar';

export const NavigationBar: FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isMobile } = useBreakpoint();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const helpDropdownRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, toggleTheme } = useTheme();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (helpDropdownRef.current && !helpDropdownRef.current.contains(event.target as Node)) {
        setShowHelpDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  const navLinks = [
    { to: '/templates', label: 'Templates' },
    { to: '/explore', label: 'Explore' },
    { to: '/editor', label: 'Create' },
  ];

  const isActiveLink = (path: string) => location.pathname === path;

  // Consistent compact styling across all pages
  const navHeight = 'h-12';
  const iconSize = 'w-5 h-5';
  const textSize = 'text-sm';
  const logoSize = 'text-lg';
  const padding = 'px-3 py-1.5';
  const avatarSize = 'w-7 h-7 text-xs';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-pipe-forge ${navHeight}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Left: Logo and hamburger */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {isMobile && (
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="text-white p-2 -ml-2"
                  aria-label="Toggle menu"
                >
                  <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showMobileMenu ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}
              <Link to="/" className="flex items-center gap-2">
                {/* Logo Icon */}
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="nav-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fff" />
                      <stop offset="100%" stopColor="#E0E7FF" />
                    </linearGradient>
                  </defs>
                  <circle cx="6" cy="12" r="3.5" fill="url(#nav-logo-gradient)" />
                  <circle cx="18" cy="12" r="3.5" fill="url(#nav-logo-gradient)" />
                  <path d="M9.5 12h5M12.5 9.5l2 2.5-2 2.5" stroke="url(#nav-logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className={`${logoSize} font-bold text-white`}>Pipe Forge</span>
              </Link>
            </div>

            {/* Center: Nav links (desktop) - absolutely centered */}
            {!isMobile && (
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`
                      ${padding} rounded-md ${textSize} font-medium transition-colors
                      ${isActiveLink(link.to)
                        ? 'bg-white/20 text-white'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Right: Theme, Help and User menu */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <Tooltip content={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`} position="bottom">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === 'light' ? (
                    <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>
              </Tooltip>

              {/* Help dropdown */}
              <div ref={helpDropdownRef} className="relative">
                <Tooltip content="Help & Shortcuts" position="bottom">
                  <button
                    onClick={() => setShowHelpDropdown(!showHelpDropdown)}
                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    aria-label="Help"
                  >
                    <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </Tooltip>

                {showHelpDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-bg-surface-elevated rounded-lg shadow-lg py-1 z-50 animate-fade-in border border-border-default">
                    <div className="px-4 py-2 border-b border-border-muted">
                      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Help & Resources</p>
                    </div>
                    <Link
                      to="/shortcuts"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover flex items-center gap-2"
                      onClick={() => setShowHelpDropdown(false)}
                    >
                      <span>⌨️</span>
                      <span>Keyboard Shortcuts</span>
                      <span className="ml-auto text-xs text-text-tertiary">?</span>
                    </Link>
                    <Link
                      to="/help"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover flex items-center gap-2"
                      onClick={() => setShowHelpDropdown(false)}
                    >
                      <span>📚</span>
                      <span>Help & Docs</span>
                    </Link>
                    <Link
                      to="/templates"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover flex items-center gap-2"
                      onClick={() => setShowHelpDropdown(false)}
                    >
                      <span>🧩</span>
                      <span>Templates</span>
                    </Link>
                    <hr className="my-1 border-border-muted" />
                    <Link
                      to="/contact"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover flex items-center gap-2"
                      onClick={() => setShowHelpDropdown(false)}
                    >
                      <span>💬</span>
                      <span>Contact Support</span>
                    </Link>
                  </div>
                )}
              </div>

              {isAuthenticated ? (
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
                    aria-haspopup="true"
                    aria-expanded={showDropdown}
                  >
                    <Avatar
                      src={user?.avatar_url}
                      name={user?.name || user?.email || '?'}
                      size="sm"
                      className="border border-white/30"
                    />
                    {!isMobile && (
                      <svg
                        className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-bg-surface-elevated rounded-md shadow-lg py-1 z-50 animate-fade-in border border-border-default">
                      <div className="px-4 py-2 border-b border-border-muted">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {(user as any)?.display_name || (user as any)?.username || user?.email?.split('@')[0]}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover"
                        onClick={() => setShowDropdown(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover"
                        onClick={() => setShowDropdown(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        to="/profile?tab=secrets"
                        className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-hover"
                        onClick={() => setShowDropdown(false)}
                      >
                        Secrets
                      </Link>
                      <hr className="my-1 border-border-muted" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-status-error hover:bg-status-error-light"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Anonymous indicator */}
                  <Tooltip content="You're not signed in. Sign up to save pipes permanently." position="bottom">
                    <div className={`${avatarSize} bg-white/10 rounded-full flex items-center justify-center text-white/70 border border-white/20`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </Tooltip>
                  <Link
                    to="/login"
                    className={`${padding} text-white/90 hover:text-white ${textSize} font-medium transition-colors`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className={`${padding} bg-white text-[#4C3575] rounded-md ${textSize} font-medium hover:bg-white/90 transition-colors whitespace-nowrap`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out drawer */}
      {isMobile && showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-bg-overlay z-40 animate-fade-in"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-12 left-0 bottom-0 w-64 bg-bg-surface z-40 shadow-xl animate-slide-in-right border-r border-border-default">
            <div className="py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    block px-6 py-3 text-base font-medium transition-colors
                    ${isActiveLink(link.to)
                      ? 'bg-accent-purple-light text-accent-purple border-l-4 border-accent-purple'
                      : 'text-text-primary hover:bg-bg-surface-hover'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

    </>
  );
};
