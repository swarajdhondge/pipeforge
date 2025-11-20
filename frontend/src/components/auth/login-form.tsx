import { useState, useEffect, type FC, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { clearError } from '../../store/slices/auth-slice';

// Parse error to get message and type
interface ErrorInfo {
  message: string;
  isUserNotFound: boolean;
  isWrongPassword: boolean;
}

const getErrorInfo = (error: string): ErrorInfo => {
  const lowerError = error.toLowerCase();
  
  // Check for "no account found" / user not found
  if (lowerError.includes('no account found') || lowerError.includes('user not found')) {
    return {
      message: 'No account found with this email.',
      isUserNotFound: true,
      isWrongPassword: false,
    };
  }
  
  // Check for wrong password
  if (lowerError.includes('incorrect password') || lowerError.includes('invalid password')) {
    return {
      message: 'Incorrect password. Please try again.',
      isUserNotFound: false,
      isWrongPassword: true,
    };
  }
  
  // Network errors
  if (lowerError.includes('network') || lowerError.includes('connect')) {
    return {
      message: 'Unable to connect. Please check your internet connection.',
      isUserNotFound: false,
      isWrongPassword: false,
    };
  }
  
  // Rate limiting
  if (lowerError.includes('too many')) {
    return {
      message: 'Too many login attempts. Please wait a moment and try again.',
      isUserNotFound: false,
      isWrongPassword: false,
    };
  }
  
  return {
    message: error,
    isUserNotFound: false,
    isWrongPassword: false,
  };
};

export const LoginForm: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const dispatch = useDispatch();
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const { drafts } = useSelector((state: RootState) => state.anonymous);
  const navigate = useNavigate();

  // Navigate to home when login succeeds
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) dispatch(clearError());
    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) dispatch(clearError());
    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await login({ email, password, localPipes: drafts });
    // Navigation will happen via useEffect when isAuthenticated changes
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          disabled={isLoading}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus ${
            errors.email ? 'border-status-error' : 'border-border-default'
          }`}
          placeholder="you@example.com"
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-status-error">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          disabled={isLoading}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus ${
            errors.password ? 'border-status-error' : 'border-border-default'
          }`}
          placeholder="••••••••"
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-status-error">{errors.password}</p>
        )}
        <div className="mt-1 text-right">
          <Link 
            to="/forgot-password" 
            className="text-sm text-text-link hover:text-accent-purple"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {error && (() => {
        const errorInfo = getErrorInfo(error);
        return (
          <div className={`p-4 rounded-md border ${
            errorInfo.isUserNotFound 
              ? 'bg-status-info-light border-status-info' 
              : 'bg-status-error-light border-status-error'
          }`}>
            <div className="flex items-start gap-3">
              <svg 
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  errorInfo.isUserNotFound ? 'text-status-info' : 'text-status-error'
                }`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className={`text-sm font-medium ${
                  errorInfo.isUserNotFound ? 'text-status-info-dark' : 'text-status-error-dark'
                }`}>
                  {errorInfo.message}
                </p>
                {errorInfo.isUserNotFound && (
                  <Link 
                    to="/register" 
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-status-info hover:text-status-info-dark"
                  >
                    Create an account
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
                {errorInfo.isWrongPassword && (
                  <Link 
                    to="/forgot-password" 
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-status-error hover:text-status-error-dark"
                  >
                    Forgot your password?
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
                {!errorInfo.isUserNotFound && !errorInfo.isWrongPassword && (
                  <p className="mt-1 text-xs text-status-error">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium underline hover:text-status-error-dark">
                      Sign up here
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-pipe-forge text-text-inverse rounded-md font-medium hover:bg-pipe-forge-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
