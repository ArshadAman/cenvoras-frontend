import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getUserRole } from '../utils/auth';

const ProtectedRoute = ({ allowedRoles, children }) => {
    const role = getUserRole(); // Or get from localStorage directly if we sync it there
    
    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/dashboard" replace />; // Redirect to dashboard if unauthorized
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
