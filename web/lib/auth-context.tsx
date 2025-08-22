'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { GoogleAuthService, type User, type GoogleAuthResponse } from '@/lib/google-auth';

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
 * Authentication provider that manages user authentication state across the app.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status when the app loads
    checkAuthStatus();
  }, []);

  /**
   * Check current authentication status.
   */
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      if (GoogleAuthService.isAuthenticated()) {
        const userData = GoogleAuthService.getUser();
        
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);

          // Optionally fetch fresh user data from server
          try {
            const freshUserData = await GoogleAuthService.getUserProfile();
            setUser(freshUserData);
          } catch (error) {
            // If fetching fresh data fails, keep using stored data
            console.warn('Failed to fetch fresh user data:', error);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
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
      await GoogleAuthService.logout();
      
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
      await GoogleAuthService.refreshTokens();
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
      const updatedUser = await GoogleAuthService.updateUserProfile(userData);
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
    // Add any post-login logic here
    console.log('User logged in successfully:', response.user.email);
    
    // Example: Track login event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'login', {
        method: 'Google',
        user_id: response.user.id,
      });
    }
  };

  /**
   * Post-logout success handler.
   */
  const onLogoutSuccess = async () => {
    // Add any post-logout logic here
    console.log('User logged out successfully');
    
    // Example: Track logout event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'logout');
    }
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
 * Higher-order component to protect routes that require authentication.
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className=\"flex items-center justify-center min-h-screen\">
          <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login or show login component
      return (
        <div className=\"flex items-center justify-center min-h-screen\">
          <div className=\"text-center\">
            <h2 className=\"text-2xl font-semibold mb-4\">Authentication Required</h2>
            <p className=\"text-gray-600 mb-6\">Please sign in to access this page.</p>
            {/* Add login component here */}
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Hook to protect routes with authentication requirement.
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    isAuthRequired: !isAuthenticated && !isLoading,
  };
}

/**
 * Component to conditionally render content based on authentication status.
 */
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, fallback, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center py-8\">
        <div className=\"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600\"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!requireAuth && isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Hook for handling authentication-related side effects.
 */
export function useAuthEffects() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Set up analytics user properties when authenticated
    if (isAuthenticated && user) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'GA_TRACKING_ID', {
          user_id: user.id,
          custom_map: {
            auth_provider: user.auth_provider,
          },
        });
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Set up periodic token refresh
    if (isAuthenticated) {
      const interval = setInterval(async () => {
        try {
          await GoogleAuthService.refreshTokens();
        } catch (error) {
          console.warn('Background token refresh failed:', error);
        }
      }, 10 * 60 * 1000); // Refresh every 10 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
}

// Type declaration for Google Analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}