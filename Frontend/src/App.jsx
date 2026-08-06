import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom';
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
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

function AnimatedPage({ children }) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen"
        >
            {children}
        </motion.div>
    );
}

const App = () => {
    const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        // Ensure dark mode
        document.documentElement.classList.add('dark');
    }, []);

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
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center animate-float">
                            <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                        </div>
                        <div className="absolute inset-0 rounded-xl bg-white/10 animate-glow-pulse" />
                    </div>
                    <p className="text-sm text-muted-foreground">Checking session…</p>
                </motion.div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <AnimatePresence mode="wait">
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
            </AnimatePresence>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        color: 'var(--foreground)',
                        border: '1px solid rgba(59, 130, 246, 0.16)',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        padding: '10px 14px',
                        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.12)',
                    },
                    success: {
                        iconTheme: { primary: '#2563eb', secondary: '#eff6ff' },
                    },
                    error: {
                        iconTheme: { primary: '#1e40af', secondary: '#eff6ff' },
                    },
                }}
            />
        </ErrorBoundary>
    )
}

export default App