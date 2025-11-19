import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExecutionLimit } from '../../hooks/use-execution-limit';

export const SignupPromptModal: FC = () => {
  const { showSignupModal, closeSignupModal } = useExecutionLimit();
  const navigate = useNavigate();

  if (!showSignupModal) return null;

  const handleSignup = () => {
    closeSignupModal();
    navigate('/register');
  };

  const handleLogin = () => {
    closeSignupModal();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-surface rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-status-warning-light">
            <svg
              className="h-6 w-6 text-status-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-text-primary">
            You've used your 5 free executions!
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Sign up to get unlimited executions and save your pipes permanently.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleSignup}
              className="w-full px-4 py-2 bg-accent-purple text-white rounded-md font-medium hover:bg-accent-purple-hover transition-colors"
            >
              Sign Up Free
            </button>
            <button
              onClick={handleLogin}
              className="w-full px-4 py-2 bg-bg-surface border border-border-default text-text-primary rounded-md font-medium hover:bg-bg-surface-hover transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={closeSignupModal}
              className="text-sm text-text-tertiary hover:text-text-secondary"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
