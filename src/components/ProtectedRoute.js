import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireRole = null, requireAdmin = false, requireOwner = false }) => {
  const { isAuthenticated, canAccessAdmin, isOwner, isAdmin } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check admin access
  if (requireAdmin && !canAccessAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Check owner access
  if (requireOwner && !isOwner()) {
    return <Navigate to="/" replace />;
  }

  // Check specific role requirements
  if (requireRole) {
    if (requireRole === 'owner' && !isOwner()) {
      return <Navigate to="/" replace />;
    }
    if (requireRole === 'admin' && !isAdmin()) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
