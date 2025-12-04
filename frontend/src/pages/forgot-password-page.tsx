import { useState, type FC, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { AuthLayout } from '../components/auth/auth-layout';
import api from '../services/api';

export const ForgotPasswordPage: FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <AuthLayout>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success-light flex items-center justify-center">
                <svg className="w-8 h-8 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Check your email</h1>
              <p className="text-text-secondary mb-6">
                If an account exists for {email}, we've sent a password reset link.
              </p>
              <Link to="/login">
                <Button variant="secondary">Back to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Forgot password?</h1>
              <p className="text-text-secondary mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  error={error}
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={status === 'loading'}
                >
                  Send Reset Link
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-text-secondary">
                Remember your password?{' '}
                <Link to="/login" className="text-text-link hover:text-accent-purple font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </AuthLayout>
  );
};
