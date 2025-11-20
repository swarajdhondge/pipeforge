import { useEffect, type FC } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { LoginForm } from '../components/auth/login-form';
import { GoogleOAuthButton } from '../components/auth/google-oauth-button';
import { AuthLayout } from '../components/auth/auth-layout';
import { migrateDrafts } from '../store/slices/auth-slice';
import type { AppDispatch } from '../store/store';

const AUTH_REDIRECT_KEY = 'pipe_forge_auth_redirect';

export const LoginPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const oauthError = searchParams.get('error');

  // Redirect if already authenticated and handle draft migration
  useEffect(() => {
    if (isAuthenticated) {
      // Migrate drafts
      dispatch(migrateDrafts());
      
      // Check if we should redirect to editor
      const authRedirect = localStorage.getItem(AUTH_REDIRECT_KEY);
      if (authRedirect) {
        localStorage.removeItem(AUTH_REDIRECT_KEY);
        navigate('/editor');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, navigate, dispatch]);

  return (
    <AuthLayout>
      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold text-text-primary">
            Sign in to Pipe Forge
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{' '}
            <Link to="/register" className="font-medium text-text-link hover:text-accent-purple">
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-bg-surface py-8 px-4 shadow-md sm:rounded-lg sm:px-10 border border-border-default">
            {oauthError === 'oauth_failed' && (
              <div className="mb-4 p-3 bg-status-error-light border border-status-error rounded-md">
                <p className="text-sm text-status-error">
                  Google sign-in failed. Please try again or use email/password.
                </p>
              </div>
            )}
            
            <LoginForm />

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-default" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-bg-surface text-text-tertiary">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <GoogleOAuthButton mode="signin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
