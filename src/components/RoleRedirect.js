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
      
      // Define admin/owner protected routes
      const isOnAdminPage = currentPath.startsWith('/admin') || 
                           currentPath.startsWith('/owner') || 
                           currentPath.startsWith('/inventory');
      
      // Define customer pages that should be accessible
      const customerPages = ['/', '/about', '/highlights', '/branches', '/faqs', '/contacts'];
      const isOnCustomerPage = customerPages.includes(currentPath);
      
      // Only redirect if:
      // 1. User is on home page (/) and has admin/owner role
      // 2. User is trying to access admin pages without proper role
      if (currentPath === '/' && (user.role === 'owner' || user.role === 'admin')) {
        // Redirect admin/owner users from home to their dashboard
        if (user.role === 'owner') {
          navigate('/owner', { replace: true });
        } else if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        }
      } else if (isOnAdminPage && user.role === 'customer') {
        // Redirect customers away from admin pages
        navigate('/', { replace: true });
      }
      // Allow customers to access all customer pages without redirect
    }
  }, [user, isAuthenticated, navigate, location.pathname]);

  return null; // This component doesn't render anything
};

export default RoleRedirect;
