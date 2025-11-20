import type { FC } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setTokens, fetchProfile } from '../store/slices/auth-slice';
import { clearLocalData } from '../store/slices/anonymous-slice';
import type { AppDispatch } from '../store/store';

export const OAuthCallbackPage: FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Extract tokens from URL
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      const error = params.get('error');

      if (error) {
        // OAuth failed
        navigate('/login?error=oauth_failed');
        return;
      }

      if (accessToken && refreshToken) {
        // Store tokens
        dispatch(setTokens({ accessToken, refreshToken }));
        
        // Fetch user profile (important for Google OAuth!)
        try {
          await dispatch(fetchProfile()).unwrap();
        } catch (err) {
          console.error('Failed to fetch profile after OAuth:', err);
        }
        
        // Clear local data (pipes migrated)
        dispatch(clearLocalData());
        
        // Redirect to home
        navigate('/');
      } else {
        // Missing tokens
        navigate('/login?error=oauth_failed');
      }
    };

    handleOAuthCallback();
  }, [navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto"></div>
        <p className="mt-4 text-text-secondary">Completing sign in...</p>
      </div>
    </div>
  );
};
