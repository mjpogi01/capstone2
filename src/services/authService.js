import { supabase } from '../lib/supabase';
import userProfileService from './userProfileService';

class AuthService {
  async signUp(userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            full_name: userData.fullName,
            phone: userData.phone,
            role: userData.role || 'customer'
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Sign up failed');
      }

      // Create user profile if user was created successfully
      if (data.user) {
        try {
          await userProfileService.createUserProfile(data.user.id, {
            full_name: userData.fullName,
            phone: userData.phone,
            gender: userData.gender || 'Male',
            date_of_birth: userData.dateOfBirth,
            address: userData.address,
            avatar_url: null
          });
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw error here as the user account was created successfully
        }
      }

      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async signIn(credentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw new Error(error.message || 'Sign in failed');
      }

      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw new Error(error.message || 'Sign out failed');
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  isAuthenticated() {
    // This method is deprecated - use the auth state listener in AuthContext instead
    return false;
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default new AuthService();
