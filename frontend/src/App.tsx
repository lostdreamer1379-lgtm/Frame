import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { queryClient } from '@/lib/queryClient';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { ROUTES } from '@/lib/routes';
import { FrameOpening } from '@/components/common/FrameOpening';

// Lazy-loaded pages
const HomePage            = lazy(() => import('@/pages/Home'));
const ExplorePage         = lazy(() => import('@/pages/Explore'));
const MoviePage           = lazy(() => import('@/pages/MovieDetails'));
const WatchPage           = lazy(() => import('@/pages/Watch'));
const WatchPartyPage      = lazy(() => import('@/pages/WatchParty'));
const WatchlistPage       = lazy(() => import('@/pages/Watchlist'));
const CollectionsPage     = lazy(() => import('@/pages/Collections'));
const CollectionDetailPage = lazy(() => import('@/pages/Collections/CollectionDetail'));
const PeoplePage          = lazy(() => import('@/pages/People'));
const ProfilePage         = lazy(() => import('@/pages/Profile'));
const SettingsPage        = lazy(() => import('@/pages/Settings'));
const LoginPage           = lazy(() => import('@/pages/Auth/LoginPage'));
const SignupPage          = lazy(() => import('@/pages/Auth/SignupPage'));
const ForgotPasswordPage  = lazy(() => import('@/pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('@/pages/Auth/ResetPasswordPage'));
const NotFoundPage        = lazy(() => import('@/pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]" style={{ background: 'var(--bg-main)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl border border-[var(--accent)] flex items-center justify-center bg-[var(--accent-muted)]">
          <span className="font-display text-base font-bold text-[var(--accent)]">F</span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)', animation: 'bounce 1s ease infinite', animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showOpening, setShowOpening] = React.useState(true);
  const completeOpening = React.useCallback(() => setShowOpening(false), []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth — no nav/footer */}
                <Route path={ROUTES.LOGIN}           element={<LoginPage />} />
                <Route path={ROUTES.SIGNUP}          element={<SignupPage />} />
                <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={ROUTES.RESET_PASSWORD}  element={<ResetPasswordPage />} />

                {/* Main layout */}
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.HOME}        element={<HomePage />} />
                  <Route path={ROUTES.EXPLORE}     element={<ExplorePage />} />
                  <Route path={ROUTES.MOVIE}       element={<MoviePage />} />
                  <Route path={ROUTES.WATCH}       element={<WatchPage />} />
                  <Route path={ROUTES.WATCH_PARTY} element={<WatchPartyPage />} />
                  <Route path={ROUTES.WATCHLIST}   element={<WatchlistPage />} />
                  <Route path={ROUTES.COLLECTIONS} element={<CollectionsPage />} />
                  <Route path={ROUTES.COLLECTION}  element={<CollectionDetailPage />} />
                  <Route path={ROUTES.PEOPLE}      element={<PeoplePage />} />
                  <Route path={ROUTES.PROFILE}     element={<ProfilePage />} />
                  <Route
                    path={ROUTES.SETTINGS}
                    element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>

            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontSize: '0.8125rem',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-md)',
                },
                success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-main)' } },
                error:   { iconTheme: { primary: 'var(--danger)',  secondary: 'var(--bg-main)' } },
              }}
            />
          </BrowserRouter>

          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ThemeProvider>
      {showOpening && <FrameOpening onComplete={completeOpening} />}
    </AuthProvider>
  );
}
