import React, { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore, LoginPage, SignUpPage, EmailVerification } from './modules/auth';
import { DashboardPage } from './modules/chat';
import ErrorBoundary from './core/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { disconnectSocket, ensureSocket } from './core/socket/socket';
import { Toaster } from 'react-hot-toast';
import LoadingComponent from './core/components/LoadingComponent';
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
        return (
            <LoadingComponent/>
        );
    }

    return (
        <ErrorBoundary>
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <AnimatedPage>
                            {isAuthenticated ? <DashboardPage /> : <LoginPage />}
                        </AnimatedPage>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <AnimatedPage>
                            <LoginPage />
                        </AnimatedPage>
                    }
                />
                <Route
                    path="/signup"
                    element={
                        <AnimatedPage>
                            <SignUpPage />
                        </AnimatedPage>
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
            </Routes>
            <Toaster
                position="top-center"
            />
        </ErrorBoundary>
    )
}

export default App