import { useState, useEffect, type FC, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { clearError } from '../../store/slices/auth-slice';

// Map backend errors to user-friendly messages
const getErrorMessage = (error: string): { message: string; isEmailExists: boolean } => {
  const lowerError = error.toLowerCase();
  if (lowerError.includes('already exists') || lowerError.includes('already registered')) {
    return {
      message: 'This email is already registered.',
      isEmailExists: true,
    };
  }
  if (lowerError.includes('network') || lowerError.includes('connect')) {
    return {
      message: 'Unable to connect. Please check your internet connection and try again.',
      isEmailExists: false,
    };
  }
  return { message: error, isEmailExists: false };
};

export const RegisterForm: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  const dispatch = useDispatch();
  const { register, isLoading, error, isAuthenticated } = useAuth();
  const { drafts } = useSelector((state: RootState) => state.anonymous);
  const navigate = useNavigate();

  // Navigate to home when registration succeeds
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

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
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
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (password.length > 100) {
      newErrors.password = 'Password must be less than 100 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await register({ email, password, localPipes: drafts });
    // Navigation will happen via useEffect when isAuthenticated changes
  };

  const errorInfo = error ? getErrorMessage(error) : null;

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
          aria-describedby={errors.password ? 'password-error' : 'password-hint'}
        />
        <p id="password-hint" className="mt-1 text-xs text-text-tertiary">
          Must be at least 8 characters
        </p>
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-status-error">{errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          disabled={isLoading}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-border-focus ${
            errors.confirmPassword ? 'border-status-error' : 'border-border-default'
          }`}
          placeholder="••••••••"
          aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
        />
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="mt-1 text-sm text-status-error">{errors.confirmPassword}</p>
        )}
      </div>

      {errorInfo && (
        <div className={`p-4 rounded-md border ${
          errorInfo.isEmailExists 
            ? 'bg-status-info-light border-status-info' 
            : 'bg-status-error-light border-status-error'
        }`}>
          <div className="flex items-start gap-3">
            <svg 
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                errorInfo.isEmailExists ? 'text-status-info' : 'text-status-error'
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {errorInfo.isEmailExists ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <div>
              <p className={`text-sm font-medium ${
                errorInfo.isEmailExists ? 'text-status-info-dark' : 'text-status-error-dark'
              }`}>
                {errorInfo.message}
              </p>
              {errorInfo.isEmailExists && (
                <Link 
                  to="/login" 
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-status-info hover:text-status-info-dark"
                >
                  Sign in to your account
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-pipe-forge text-text-inverse rounded-md font-medium hover:bg-pipe-forge-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};
