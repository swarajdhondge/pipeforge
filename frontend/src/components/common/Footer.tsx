import type { FC } from 'react';
import { Link } from 'react-router-dom';

export const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-inverse text-text-inverse-secondary w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Main footer content - flex for proper alignment with nav */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-8">
          {/* Brand - left side */}
          <div className="flex-1 max-w-lg">
            <Link to="/" className="text-xl font-bold text-text-inverse inline-flex items-center gap-2">
              🔧 Pipe Forge
            </Link>
            <p className="mt-3 text-sm text-text-inverse-tertiary">
              Visual data pipelines for everyone. Connect APIs, transform data, 
              and automate workflows with an intuitive drag-and-drop interface.
            </p>
            <p className="mt-2 text-xs text-text-inverse-tertiary opacity-60">
              A resurrection of Yahoo Pipes for the modern era.
            </p>
          </div>

          {/* Quick Links - right side */}
          <div className="sm:text-right">
            <h3 className="text-sm font-semibold text-text-inverse uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/templates"
                  className="text-sm text-text-inverse-tertiary hover:text-text-inverse transition-colors"
                >
                  Templates
                </Link>
              </li>
              <li>
                <Link
                  to="/explore"
                  className="text-sm text-text-inverse-tertiary hover:text-text-inverse transition-colors"
                >
                  Explore Pipes
                </Link>
              </li>
              <li>
                <Link
                  to="/editor"
                  className="text-sm text-text-inverse-tertiary hover:text-text-inverse transition-colors"
                >
                  Create Pipe
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="text-sm text-text-inverse-tertiary hover:text-text-inverse transition-colors"
                >
                  Help & Docs
                </Link>
              </li>
              <li>
                <Link
                  to="/shortcuts"
                  className="text-sm text-text-inverse-tertiary hover:text-text-inverse transition-colors"
                >
                  Keyboard Shortcuts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-inverse-tertiary text-center sm:text-left">
              © {currentYear} Pipe Forge. Built for the Kiroween Hackathon 🎃
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/swarajdhondge/pipeforge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-inverse-tertiary hover:text-text-inverse transition-colors flex items-center gap-1.5"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://github.com/swarajdhondge/pipeforge/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-inverse-tertiary hover:text-text-inverse transition-colors text-sm"
                aria-label="Report Issue"
              >
                Report Issue
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
