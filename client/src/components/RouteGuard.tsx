import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

// ProtectedRoute: Only allows authenticated users with specific roles to access the children routes
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role.toLowerCase())) {
        return <Navigate to="/not-found" replace />;
    }

    return <Outlet />;
};

// PublicRoute: Redirects authenticated users away from public pages (like Login/Signup)
export const PublicRoute: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
