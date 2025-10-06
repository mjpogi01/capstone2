import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      const currentPath = location.pathname;
      
      // Only redirect if user is on home page or other non-admin pages
      const isOnAdminPage = currentPath.startsWith('/admin') || 
                           currentPath.startsWith('/owner') || 
                           currentPath.startsWith('/inventory');
      
      if (!isOnAdminPage) {
        // Redirect based on user role only when not on admin pages
        if (user.role === 'owner') {
          navigate('/owner', { replace: true });
        } else if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          // For customers, redirect to home
          navigate('/', { replace: true });
        }
      }
    }
  }, [user, isAuthenticated, navigate, location.pathname]);

  return null; // This component doesn't render anything
};

export default RoleRedirect;
