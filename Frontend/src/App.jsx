import React, { useEffect, lazy, Suspense } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import useAuthStore from './modules/auth/stores/useAuthStore';
import ErrorBoundary from './core/components/ErrorBoundary';
import ProtectedRoute from './core/components/ProtectedRoute';
import PublicOnlyRoute from './core/components/PublicOnlyRoute';
import { disconnectSocket, ensureSocket } from './core/socket/socket';
import { Toaster } from 'react-hot-toast';
import LoadingComponent from './core/components/LoadingComponent';

const LoginPage = lazy(() => import('./modules/auth/pages/LoginPage'));
const SignUpPage = lazy(() => import('./modules/auth/pages/SignUpPage'));
const EmailVerification = lazy(() => import('./modules/auth/pages/EmailVerification').then(m => ({ default: m.EmailVerification })));
const DashboardPage = lazy(() => import('./modules/chat/pages/DashboardPage'));

function AnimatedPage({ children }) {
    return (
        <div className="min-h-screen animate-fade-in">
            {children}
        </div>
    );
}

const App = () => {
    const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
    const location = useLocation();

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
        return <LoadingComponent />;
    }

    return (
        <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <PublicOnlyRoute>
                                <AnimatedPage>
                                    <LoginPage />
                                </AnimatedPage>
                            </PublicOnlyRoute>
                        }
                    />
                    <Route
                        path="/signup"
                        element={
                            <PublicOnlyRoute>
                                <AnimatedPage>
                                    <SignUpPage />
                                </AnimatedPage>
                            </PublicOnlyRoute>
                        }
                    />
                    <Route
                        path="/verify-email"
                        element={
                            <AnimatedPage>
                                <EmailVerification />
                            </AnimatedPage>
                        }
                    />

                    {/* Protected Dashboard Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/chats"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/chats/:conversationId"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/people"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/invitations"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="*"
                        element={<Navigate to={isAuthenticated ? "/chats" : "/login"} replace />}
                    />
                </Routes>
            </Suspense>
            <Toaster position="top-center" />
        </ErrorBoundary>
    );
};

export default App;