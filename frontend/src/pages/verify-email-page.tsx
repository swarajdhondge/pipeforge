import { useEffect, useState, type FC } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { AuthLayout } from '../components/auth/auth-layout';
import api from '../services/api';
import { fetchProfile } from '../store/slices/auth-slice';
import type { AppDispatch } from '../store/store';

export const VerifyEmailPage: FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
        // Refresh user profile to update email_verified status in Redux
        // This ensures the verification banner disappears
        dispatch(fetchProfile());
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.error || 'Verification failed');
      }
    };

    verifyEmail();
  }, [token, dispatch]);

  return (
    <AuthLayout>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-purple-light flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-purple animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Verifying your email...</h1>
              <p className="text-text-secondary">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success-light flex items-center justify-center">
                <svg className="w-8 h-8 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Email Verified! 🎉</h1>
              <p className="text-text-secondary mb-6">Your account is now fully activated.</p>
              <Link to="/editor">
                <Button>Start Building Pipes</Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error-light flex items-center justify-center">
                <svg className="w-8 h-8 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Verification Failed</h1>
              <p className="text-text-secondary mb-6">{error}</p>
              <Link to="/login">
                <Button variant="secondary">Back to Login</Button>
              </Link>
            </>
          )}
        </Card>
      </div>
    </AuthLayout>
  );
};
