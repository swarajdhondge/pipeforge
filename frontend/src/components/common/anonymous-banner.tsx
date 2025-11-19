import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useAuth } from '../../hooks/use-auth';

const BANNER_DISMISSED_KEY = 'pipe_forge_banner_dismissed';

export const AnonymousBanner: FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { executionCount, executionLimit } = useSelector(
    (state: RootState) => state.anonymous
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  // Don't show banner if authenticated
  if (isAuthenticated) return null;

  // Don't show if dismissed
  if (isDismissed) return null;

  const remaining = executionLimit - executionCount;

  // Hide banner when limit reached (modal will show instead)
  if (remaining <= 0) return null;

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  // Show different messages based on execution count
  const getMessage = () => {
    if (executionCount === 0) {
      return "You're working anonymously. Sign up to save your pipes permanently.";
    } else if (executionCount >= 3) {
      return `${remaining} free execution${remaining !== 1 ? 's' : ''} remaining. Sign up for unlimited!`;
    } else {
      return "You're working anonymously. Sign up to save your pipes permanently.";
    }
  };

  return (
    <div className="bg-pipe-forge text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <svg className="w-5 h-5 text-white/90 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-white/95">
              {getMessage()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-1.5 text-sm font-medium text-[#4C3575] bg-white rounded-md hover:bg-white/90 whitespace-nowrap transition-colors"
            >
              Sign Up Free
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-white/80 hover:text-white rounded-md hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
