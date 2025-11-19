import { type FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from './Modal';
import { Button } from './Button';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionExpiredModal: FC<SessionExpiredModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    // Store current URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    onClose();
    navigate('/login');
  };

  const handleContinue = () => {
    onClose();
    navigate('/');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Expired"
      size="sm"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="text-center py-4">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-neutral-600 mb-6">
          Your session has expired. Please sign in again to continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleLogin}>
            Sign In
          </Button>
          <Button variant="secondary" onClick={handleContinue}>
            Continue as Guest
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Hook to use session expiry detection
import { useState, useEffect, useCallback } from 'react';

export const useSessionExpiry = () => {
  const [isExpired, setIsExpired] = useState(false);

  const handleSessionExpired = useCallback(() => {
    setIsExpired(true);
  }, []);

  const clearExpired = useCallback(() => {
    setIsExpired(false);
  }, []);

  // Listen for custom session expired event
  useEffect(() => {
    const handleEvent = () => handleSessionExpired();
    window.addEventListener('session-expired', handleEvent);
    return () => window.removeEventListener('session-expired', handleEvent);
  }, [handleSessionExpired]);

  return { isExpired, handleSessionExpired, clearExpired };
};

// Utility to trigger session expired event (call from API interceptor)
export const triggerSessionExpired = () => {
  window.dispatchEvent(new CustomEvent('session-expired'));
};
