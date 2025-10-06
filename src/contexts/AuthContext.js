import React, { createContext, useContext, useState, useEffect } from 'react';
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
    // Check if user is already logged in on app start
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const result = await authService.signIn(credentials);
      setUser(result.user);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.signUp(userData);
      setUser(result.user);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.signOut();
    setUser(null);
  };

  // Role-based helper functions
  const isOwner = () => user?.role === 'owner';
  const isAdmin = () => user?.role === 'admin';
  const isCustomer = () => user?.role === 'customer';
  const hasAdminAccess = () => user?.role === 'admin' || user?.role === 'owner';
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
