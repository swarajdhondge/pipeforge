import { useState, type FC, type FormEvent } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { AuthLayout } from '../components/auth/auth-layout';
import api from '../services/api';

export const ResetPasswordPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setStatus('loading');

    try {
      await api.post('/auth/reset-password', { token, password });
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error-light flex items-center justify-center">
              <svg className="w-8 h-8 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Invalid Link</h1>
            <p className="text-text-secondary mb-6">This password reset link is invalid or has expired.</p>
            <Link to="/forgot-password">
              <Button>Request New Link</Button>
            </Link>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success-light flex items-center justify-center">
                <svg className="w-8 h-8 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Password Reset!</h1>
              <p className="text-text-secondary mb-6">
                Your password has been updated. Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Reset your password</h1>
              <p className="text-text-secondary mb-6">Enter your new password below.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  helperText="Must be at least 8 characters"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />

                {error && (
                  <p className="text-sm text-status-error">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={status === 'loading'}
                >
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </AuthLayout>
  );
};
