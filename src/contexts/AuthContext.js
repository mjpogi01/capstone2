import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import authService from '../services/authService';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showLoginSuccess, showLogoutSuccess, showError } = useNotification();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const currentTime = Date.now();
          const lastLoginTime = localStorage.getItem('lastLoginTime');
          const shouldShowWelcome = !lastLoginTime || (currentTime - parseInt(lastLoginTime)) > 3600000; // 1 hour = 3600000ms
          
          if (shouldShowWelcome) {
            const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
            showLoginSuccess(userName);
          }
          
          localStorage.setItem('lastLoginTime', currentTime.toString());
        } else if (event === 'SIGNED_OUT') {
          showLogoutSuccess();
          localStorage.removeItem('lastLoginTime');
        }
        
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [showLoginSuccess, showLogoutSuccess]);

  const login = async (credentials) => {
    try {
      const result = await authService.signIn(credentials);
      // User will be set by the auth state listener
      return result;
    } catch (error) {
      showError('Login Failed', error.message || 'Invalid credentials. Please try again.');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.signUp(userData);
      // User will be set by the auth state listener
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      // User will be cleared by the auth state listener
    } catch (error) {
      console.error('Error during logout:', error);
      showError('Logout Failed', 'There was an error logging out. Please try again.');
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Role-based helper functions
  const isOwner = () => user?.user_metadata?.role === 'owner';
  const isAdmin = () => user?.user_metadata?.role === 'admin';
  const isArtist = () => user?.user_metadata?.role === 'artist';
  const isCustomer = () => user?.user_metadata?.role === 'customer';
  const hasAdminAccess = () => user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'owner';
  const canAccessAdmin = () => hasAdminAccess();

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    isOwner,
    isAdmin,
    isArtist,
    isCustomer,
    hasAdminAccess,
    canAccessAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
