import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'player' | 'admin'; // New prop to specify required role
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, token } = useAuth(); // Use useAuth hook
  const isAuthenticated = !!token; // Check if token exists
  const userRole = user ? user.role : 'guest'; // Get user's role from context

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // User is authenticated but does not have the required role
    // Redirect to a default page or an unauthorized page
    // For now, let's redirect to home for players, or login for admins trying to access player content
    if (userRole === 'player') {
      return <Navigate to="/home" replace />; // Player trying to access admin content
    } else if (userRole === 'admin') {
      return <Navigate to="/admin/overview" replace />; // Admin trying to access player content (or just redirect to their default)
    }
    return <Navigate to="/login" replace />; // Fallback for other roles or issues
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;