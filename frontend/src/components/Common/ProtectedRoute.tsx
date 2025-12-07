import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, UserStatus } from '../../types';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    requireActive?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    requireActive = true
}) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireActive && user.status !== UserStatus.ACTIVE) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning">
                    <h4>Account Pending Approval</h4>
                    <p>Your account is pending admin approval. Please check back later.</p>
                </div>
            </div>
        );
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <h4>Access Denied</h4>
                    <p>You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
