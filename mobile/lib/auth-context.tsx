/**
 * Mobile authentication context provider for React Native app.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MobileAuthService, type User, type GoogleAuthResponse } from '../lib/mobile-auth';

interface AuthContextType {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Authentication methods
  login: (response: GoogleAuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;

  // Utility methods
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider that manages user authentication state across the mobile app.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth service and check status when the app loads
    initializeAuth();
  }, []);

  /**
   * Initialize mobile auth service and check authentication status.
   */
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Initialize the mobile auth service
      await MobileAuthService.initialize();
      
      // Check if user is already authenticated
      await checkAuthStatus();
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check current authentication status.
   */
  const checkAuthStatus = async () => {
    try {
      const authenticated = await MobileAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const userData = await MobileAuthService.getUser();
        setUser(userData);

        // Optionally fetch fresh user data from server
        try {
          const freshUserData = await MobileAuthService.getUserProfile();
          setUser(freshUserData);
        } catch (error) {
          // If fetching fresh data fails, keep using stored data
          console.warn('Failed to fetch fresh user data:', error);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Handle successful Google authentication.
   */
  const login = async (response: GoogleAuthResponse) => {
    try {
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Trigger any post-login actions
      await onLoginSuccess(response);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  /**
   * Handle user logout.
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      await MobileAuthService.signOut();
      
      setUser(null);
      setIsAuthenticated(false);
      
      // Trigger any post-logout actions
      await onLogoutSuccess();
    } catch (error) {
      console.error('Error during logout:', error);
      // Clear state anyway
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh authentication tokens.
   */
  const refreshToken = async () => {
    try {
      await MobileAuthService.refreshTokens();
      // Optionally update user data after token refresh
      await checkAuthStatus();
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, log out the user
      await logout();
      throw error;
    }
  };

  /**
   * Update user profile.
   */
  const updateProfile = async (userData: Partial<User>) => {
    try {
      const updatedUser = await MobileAuthService.updateUserProfile(userData);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  /**
   * Post-login success handler.
   */
  const onLoginSuccess = async (response: GoogleAuthResponse) => {
    console.log('User logged in successfully:', response.user.email);
    
    // Example: Track login event (if analytics is implemented)
    // Analytics.track('user_login', {
    //   method: 'Google',
    //   user_id: response.user.id,
    // });
  };

  /**
   * Post-logout success handler.
   */
  const onLogoutSuccess = async () => {
    console.log('User logged out successfully');
    
    // Example: Track logout event (if analytics is implemented)
    // Analytics.track('user_logout');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    updateProfile,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the authentication context.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook for handling authentication-related side effects.
 */
export function useAuthEffects() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Set up periodic token refresh
    if (isAuthenticated) {
      const interval = setInterval(async () => {
        try {
          await MobileAuthService.refreshTokens();
        } catch (error) {
          console.warn('Background token refresh failed:', error);
        }
      }, 10 * 60 * 1000); // Refresh every 10 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Set up user properties for analytics when authenticated
    if (isAuthenticated && user) {
      // Example: Set user properties for analytics
      // Analytics.setUserProperties({
      //   user_id: user.id,
      //   auth_provider: user.auth_provider,
      //   email: user.email,
      // });
    }
  }, [isAuthenticated, user]);
}