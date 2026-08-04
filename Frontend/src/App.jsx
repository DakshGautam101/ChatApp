import React from 'react'
import { Route, Routes } from 'react-router-dom';
import useAuthStore from './Stores/useAuthStore';
import { useEffect } from 'react';
import LoginPage from './Pages/LoginPage';
import { Toaster } from 'react-hot-toast';
import SignUpPage from './Pages/SignUpPage';
import { EmailVerification } from './Pages/EmailVerification';
import DashboardPage from './Pages/DashboardPage';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { disconnectSocket, ensureSocket } from './lib/socket';

const App = () => {

  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const authenticated = await checkAuth();
      if (!isMounted) return;

      if (authenticated) {
        ensureSocket();
      } else {
        disconnectSocket();
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      ensureSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          <p className="text-sm text-muted-foreground">Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <DashboardPage /> : <LoginPage />}
        />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/signup"
          element={<SignUpPage />}
        />
        <Route
          path="/verify-email"
          element={<EmailVerification />}
        />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--foreground)',
            color: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            padding: '10px 14px',
          },
          success: {
            iconTheme: { primary: 'var(--background)', secondary: 'var(--foreground)' },
          },
          error: {
            iconTheme: { primary: 'var(--background)', secondary: 'var(--foreground)' },
          },
        }}
      />
    </ErrorBoundary>
  )
}

export default App