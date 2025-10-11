import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import authService from '../services/authService';

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
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials) => {
    try {
      const result = await authService.signIn(credentials);
      // User will be set by the auth state listener
      return result;
    } catch (error) {
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
    }
  };

  // Role-based helper functions
  const isOwner = () => user?.user_metadata?.role === 'owner';
  const isAdmin = () => user?.user_metadata?.role === 'admin';
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
    isOwner,
    isAdmin,
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
