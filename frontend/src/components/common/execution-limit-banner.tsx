import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export const ExecutionLimitBanner: FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { executionCount, executionLimit } = useSelector(
    (state: RootState) => state.anonymous
  );
  const navigate = useNavigate();

  if (isAuthenticated) return null;

  const remaining = executionLimit - executionCount;

  if (remaining <= 0) {
    return (
      <div className="bg-status-error-light dark:bg-status-error/20 border-l-4 border-status-error p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-status-error"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="ml-3 text-sm text-status-error-dark dark:text-status-error">
              <span className="font-medium">Execution limit reached.</span> Sign up to continue!
            </p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 bg-status-error text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors"
          >
            Sign Up Free
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-status-warning-light dark:bg-status-warning/20 border-l-4 border-status-warning p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-status-warning"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="ml-3 text-sm text-status-warning-dark dark:text-status-warning">
            <span className="font-medium">{remaining} free executions remaining.</span> Sign up for unlimited!
          </p>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-2 bg-status-warning text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors"
        >
          Sign Up Free
        </button>
      </div>
    </div>
  );
};
