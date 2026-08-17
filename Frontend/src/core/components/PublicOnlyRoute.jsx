import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/modules/auth/stores/useAuthStore';
import LoadingComponent from './LoadingComponent';

export default function PublicOnlyRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return <LoadingComponent />;
    }

    if (isAuthenticated) {
        return <Navigate to="/chats" replace />;
    }

    return children ? children : <Outlet />;
}
