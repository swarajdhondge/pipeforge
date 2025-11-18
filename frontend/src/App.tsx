import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store/store';
import type { AppDispatch } from './store/store';
import { fetchProfile } from './store/slices/auth-slice';

import { ProtectedRoute } from './components/auth/protected-route';
import { SignupPromptModal } from './components/common/signup-prompt-modal';
import { MigrationSuccessToast } from './components/common/migration-success-toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './hooks/use-theme';
import { useAuth } from './hooks/use-auth';
import { NetworkErrorBanner } from './components/common/NetworkErrorBanner';
import { SkipLink } from './components/common/SkipLink';
import { WelcomeModal, useWelcomeModal } from './components/common/WelcomeModal';
import { SessionExpiredModal, useSessionExpiry } from './components/common/SessionExpiredModal';
import { EmailVerificationBanner, EmailVerificationProvider } from './components/common/EmailVerificationBanner';
import { Spinner } from './components/common/Spinner';
import { initializeLocalStorage } from './utils/localStorage';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/home-page').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/login-page').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/register-page').then(m => ({ default: m.RegisterPage })));
const OAuthCallbackPage = lazy(() => import('./pages/oauth-callback-page').then(m => ({ default: m.OAuthCallbackPage })));
const PipeEditorPage = lazy(() => import('./pages/editor').then(m => ({ default: m.EditorPage })));
const TemplatesPage = lazy(() => import('./pages/templates-page').then(m => ({ default: m.TemplatesPage })));
const BrowsePipesPage = lazy(() => import('./pages/browse-pipes-page').then(m => ({ default: m.BrowsePipesPage })));
const PipeDetailPage = lazy(() => import('./pages/pipe-detail-page').then(m => ({ default: m.PipeDetailPage })));
const UserProfilePage = lazy(() => import('./pages/user-profile-page').then(m => ({ default: m.UserProfilePage })));
const NotFoundPage = lazy(() => import('./pages/not-found-page').then(m => ({ default: m.NotFoundPage })));
const SettingsPage = lazy(() => import('./pages/settings-page').then(m => ({ default: m.SettingsPage })));
const VerifyEmailPage = lazy(() => import('./pages/verify-email-page').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password-page').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/reset-password-page').then(m => ({ default: m.ResetPasswordPage })));
const HelpPage = lazy(() => import('./pages/help-page').then(m => ({ default: m.HelpPage })));
const ContactPage = lazy(() => import('./pages/contact-page').then(m => ({ default: m.ContactPage })));
const ShortcutsPage = lazy(() => import('./pages/shortcuts-page').then(m => ({ default: m.ShortcutsPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg-app">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-text-secondary">Loading...</p>
    </div>
  </div>
);

// Redirect component for /pipes/:id -> /explore/:id
const PipeRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/explore/${id}`} replace />;
};

// Inner component to use hooks inside providers
const AppContent = () => {
  const { isOpen: isWelcomeOpen, closeModal: closeWelcome } = useWelcomeModal();
  const { isExpired: isSessionExpired, clearExpired: clearSessionExpired } = useSessionExpiry();

  // Auto-fetch profile when authenticated but user is null (e.g., page refresh, Google OAuth)
  const { isAuthenticated, user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchProfile());
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <div className="min-h-screen bg-bg-app">
      <SkipLink />
      <EmailVerificationBanner />
      <NetworkErrorBanner />
      <SignupPromptModal />
      <MigrationSuccessToast />
      <WelcomeModal isOpen={isWelcomeOpen} onClose={closeWelcome} />
      <SessionExpiredModal isOpen={isSessionExpired} onClose={clearSessionExpired} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/shortcuts" element={<ShortcutsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Templates - public */}
        <Route path="/templates" element={<TemplatesPage />} />
        
        {/* Explore pipes - public (renamed from /pipes) */}
        <Route path="/explore" element={<BrowsePipesPage />} />
        <Route path="/explore/:id" element={<PipeDetailPage />} />
        
        {/* Redirect old /pipes route to /explore for backward compatibility */}
        <Route path="/pipes" element={<Navigate to="/explore" replace />} />
        <Route path="/pipes/:id" element={<PipeRedirect />} />
        
        {/* Editor - accessible to all (anonymous + authenticated) */}
        <Route path="/editor" element={<PipeEditorPage />} />
        <Route path="/editor/:id" element={<PipeEditorPage />} />
        
        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/users/:userId" element={<UserProfilePage />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Redirect old /my-pipes route to /profile */}
        <Route path="/my-pipes" element={<Navigate to="/profile" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
};

function App() {
  // Initialize localStorage cleanup on app start
  useEffect(() => {
    initializeLocalStorage();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <BrowserRouter>
              <EmailVerificationProvider>
                <AppContent />
              </EmailVerificationProvider>
            </BrowserRouter>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
