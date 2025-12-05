import { useState, useEffect, createContext, useContext, type FC, type ReactNode } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { Button } from './Button';
import api from '../../services/api';
import { useToast } from './Toast';

const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const STORAGE_KEY = 'emailVerification_lastResendTime';
const DISMISS_STORAGE_KEY = 'emailVerification_dismissedDate';

// Helper to get today's date as YYYY-MM-DD string
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// Context for banner visibility
interface EmailVerificationContextType {
  isBannerVisible: boolean;
  dismissBanner: () => void;
}

const EmailVerificationContext = createContext<EmailVerificationContextType>({ 
  isBannerVisible: false,
  dismissBanner: () => {},
});

export const useEmailVerificationBanner = () => useContext(EmailVerificationContext);

// Provider component
export const EmailVerificationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Check if banner was dismissed today on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      const dismissKey = `${DISMISS_STORAGE_KEY}_${user.id}`;
      const dismissedDate = localStorage.getItem(dismissKey);
      const today = getTodayDateString();
      
      // If dismissed today, keep it hidden; otherwise, show it again
      setIsDismissed(dismissedDate === today);
    } else {
      setIsDismissed(false);
    }
  }, [user?.id]);
  
  const shouldShowBanner = Boolean(
    isAuthenticated && 
    user && 
    !user.email_verified && 
    user.auth_provider !== 'google'
  );
  
  const isBannerVisible = shouldShowBanner && !isDismissed;
  
  const dismissBanner = () => {
    if (user?.id) {
      // Store today's date so banner stays hidden for the rest of the day
      const dismissKey = `${DISMISS_STORAGE_KEY}_${user.id}`;
      localStorage.setItem(dismissKey, getTodayDateString());
    }
    setIsDismissed(true);
  };

  return (
    <EmailVerificationContext.Provider value={{ isBannerVisible, dismissBanner }}>
      {children}
    </EmailVerificationContext.Provider>
  );
};

// Spacer component for pages to use
export const EmailVerificationBannerSpacer: FC = () => {
  const { isBannerVisible } = useEmailVerificationBanner();
  
  if (!isBannerVisible) return null;
  
  // Match the banner height (py-2 = 8px top + 8px bottom + content ~28px = ~44px, using h-11 = 44px)
  return <div className="h-11" />;
};

export const EmailVerificationBanner: FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { isBannerVisible, dismissBanner } = useEmailVerificationBanner();
  const [isResending, setIsResending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Check cooldown on mount and set up interval
  useEffect(() => {
    const checkCooldown = () => {
      const lastResendTime = localStorage.getItem(STORAGE_KEY);
      if (lastResendTime) {
        const elapsed = Date.now() - parseInt(lastResendTime, 10);
        const remaining = Math.max(0, RESEND_COOLDOWN_MS - elapsed);
        setCooldownRemaining(remaining);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Don't show if banner is not visible
  if (!isBannerVisible || !user) {
    return null;
  }

  // Calculate time remaining (48 hours from account creation)
  const createdAt = new Date(user.created_at);
  const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

  const isOnCooldown = cooldownRemaining > 0;
  const cooldownMinutes = Math.ceil(cooldownRemaining / 60000);
  const cooldownSeconds = Math.ceil((cooldownRemaining % 60000) / 1000);

  const handleResendVerification = async () => {
    if (isOnCooldown) return;
    
    setIsResending(true);
    try {
      await api.post('/auth/resend-verification');
      // Set cooldown timestamp
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCooldownRemaining(RESEND_COOLDOWN_MS);
      
      addToast({
        type: 'success',
        title: 'Verification email sent',
        description: 'Please check your inbox and spam folder.',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to send email',
        description: error.response?.data?.error || 'Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatCooldown = () => {
    if (cooldownMinutes > 1) {
      return `${cooldownMinutes}m`;
    } else if (cooldownMinutes === 1 && cooldownSeconds > 30) {
      return `${cooldownMinutes}m`;
    } else {
      return `${cooldownSeconds}s`;
    }
  };

  return (
    <div className="fixed top-12 left-0 right-0 z-40 bg-amber-100 dark:bg-amber-900/50 border-b border-amber-300 dark:border-amber-700">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-medium">Please verify your email.</span>
              {' '}
              {hoursRemaining > 0 ? (
                <span>Your account will be deleted in {hoursRemaining} hours if not verified.</span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-medium">Your account may be deleted soon!</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleResendVerification}
              isLoading={isResending}
              disabled={isOnCooldown}
            >
              {isOnCooldown ? `Wait ${formatCooldown()}` : 'Resend Email'}
            </Button>
            <button
              onClick={dismissBanner}
              className="p-1 text-amber-700 dark:text-amber-300 hover:opacity-80 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
