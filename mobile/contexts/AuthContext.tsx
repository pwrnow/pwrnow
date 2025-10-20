import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateToken, refreshAccessToken, logout, userApi } from '../lib/api';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
} from '../lib/authStorage';
import { queryClient } from '../providers/query';
import { queryConfig } from '../lib/queryConfig';
import type { User } from '../types';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsUsernameSetup: boolean;
  justSignedIn: boolean; // Flag to track fresh sign-in vs session restore
  isStaff: boolean; // Computed property for staff status
  setAuthFromBackend: (r: any) => Promise<void>;
  signOut: () => Promise<void>;
  validateStoredCredentials: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocally: (userData: User) => Promise<void>;
  clearJustSignedInFlag: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// Keys for secure storage
// Storage keys moved to lib/authStorage to avoid cyclic deps

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsUsernameSetup, setNeedsUsernameSetup] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);

  // Helper function to check if an error is authentication-related (401/403)
  function isAuthError(error: any): boolean {
    if (!error) return false;
    
    // Check if error has a status property (from our API)
    if (error.status) {
      return error.status === 401 || error.status === 403;
    }
    
    // Check if error message contains status codes
    if (typeof error.message === 'string') {
      return error.message.includes('401:') || error.message.includes('403:');
    }
    
    // Check if it's a response object with status
    if (error.response && error.response.status) {
      return error.response.status === 401 || error.response.status === 403;
    }
    
    return false;
  }

  // Helper function to check if an error is a network-related error
  function isNetworkError(error: any): boolean {
    if (!error) return false;
    
    // Check for specific error types that indicate network issues
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      return true;
    }
    
    // Check for common network error patterns in message
    if (typeof error.message === 'string') {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('fetch') ||
        message.includes('no internet') ||
        message.includes('abort') ||
        message.includes('unreachable') ||
        message.includes('failed to fetch') ||
        message.includes('network request failed') ||
        message.includes('request timeout') ||
        message.includes('connection refused') ||
        message.includes('connection reset') ||
        message.includes('connection timed out') ||
        message.includes('dns') ||
        message.includes('enotfound') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('etimedout')
      );
    }
    
    // Check if it's a fetch error (common in React Native)
    if (error.message && typeof error.message === 'string' && error.message.includes('Network request failed')) {
      return true;
    }
    
    return false;
  }

  // Validate stored credentials on app startup
  async function validateStoredCredentials() {
    try {
      const a = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const r = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      if (a) {
        // We have stored credentials, validate them with backend
        try {
          await validateToken(a);
          setAccessToken(a);
          setRefreshToken(r);
          setIsAuthenticated(true);
          
          // Fetch fresh user details from /user/ endpoint
          try {
            const userDetails = await userApi.getCurrentUser();
            setUser(userDetails);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userDetails));
            setNeedsUsernameSetup(!userDetails?.username_set_by_user);
          } catch (userError) {
            console.warn('Failed to fetch user details:', userError);
            // Token is valid but couldn't fetch user - use cached user if available
            const u = await SecureStore.getItemAsync(USER_KEY);
            if (u) {
              setUser(JSON.parse(u));
              setNeedsUsernameSetup(!JSON.parse(u)?.username_set_by_user);
            }
          }
        } catch (error) {
          // Only try refresh if we have a refresh token and the error is auth-related
          if (r && isAuthError(error)) {
            const newAccess = await refreshAccessToken();
            if (newAccess) {
              try {
                await validateToken(newAccess);
                setAccessToken(newAccess);
                setRefreshToken(r);
                setIsAuthenticated(true);
                
                // Fetch fresh user details from /user/ endpoint
                try {
                  const userDetails = await userApi.getCurrentUser();
                  setUser(userDetails);
                  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userDetails));
                  setNeedsUsernameSetup(!userDetails?.username_set_by_user);
                } catch (userError) {
                  console.warn('Failed to fetch user details after refresh:', userError);
                  // Token is valid but couldn't fetch user - use cached user if available
                  const u = await SecureStore.getItemAsync(USER_KEY);
                  if (u) {
                    setUser(JSON.parse(u));
                    setNeedsUsernameSetup(!JSON.parse(u)?.username_set_by_user);
                  }
                }
              } catch (_e) {
                await signOut();
              }
            } else {
              await signOut();
            }
          } else if (isAuthError(error)) {
            // Only sign out on authentication errors (401/403), not network failures
            await signOut();
          } else {
            // For network failures, keep user signed in but use cached data
            console.warn('Network error during token validation, using cached credentials:', error);
            const u = await SecureStore.getItemAsync(USER_KEY);
            if (u) {
              setUser(JSON.parse(u));
              setNeedsUsernameSetup(!JSON.parse(u)?.username_set_by_user);
            }
            setIsAuthenticated(true);
          }
        }
      } else {
        // No stored credentials, user is not authenticated
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error validating stored credentials:', error);
      // Only set as not authenticated if it's an auth error, otherwise keep cached state
      if (isAuthError(error)) {
        setIsAuthenticated(false);
      } else {
        // For network errors, try to use cached credentials
        console.warn('Network error during credential validation, checking cached data:', error);
        try {
          const u = await SecureStore.getItemAsync(USER_KEY);
          if (u) {
            setUser(JSON.parse(u));
            setNeedsUsernameSetup(!JSON.parse(u)?.username_set_by_user);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch {
          setIsAuthenticated(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    validateStoredCredentials();
  }, []);

  async function setAuthFromBackend(res: any) {
    // expected backend response: { access, refresh, user }
    console.log('setAuthFromBackend', res);
    const { access, refresh, user } = res;
    if (!access) throw new Error('backend did not return access token');

    // Invalidate cached queries to refetch fresh data for the new session
    await queryClient.invalidateQueries();

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    if (refresh) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
    }
    if (user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    }

    setAccessToken(access);
    setRefreshToken(refresh ?? null);
    setUser(user ?? null);
    setIsAuthenticated(true);

    // Check if user needs to set username (not set by user yet)
    setNeedsUsernameSetup(!user?.username_set_by_user);

    // Mark as fresh sign-in (not a session restore)
    setJustSignedIn(true);

    setIsLoading(false);
  }

  async function refreshUser() {
    // Refresh user data from backend
    try {
      const userDetails = await userApi.getCurrentUser();
      setUser(userDetails);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userDetails));
      setNeedsUsernameSetup(!userDetails?.username_set_by_user);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  async function updateUserLocally(userData: User) {
    // Update user data locally without API call
    try {
      setUser(userData);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
      setNeedsUsernameSetup(!userData?.username_set_by_user);
      console.log('User updated locally:', userData);
    } catch (error) {
      console.error('Error updating user locally:', error);
    }
  }

  function clearJustSignedInFlag() {
    setJustSignedIn(false);
  }

  async function signOut() {
    // Call backend logout endpoint first
    try {
      await logout();
    } catch (error) {
      console.warn('Backend logout failed:', error);
      // Continue with local cleanup even if backend logout fails
    }

    // Clear all cached data from React Query
    await queryClient.clear();

    // Also invalidate all queries to ensure fresh data on next login
    await queryClient.invalidateQueries();

    // Clear the persisted cache from AsyncStorage directly
    // try {
    //   await AsyncStorage.removeItem(queryConfig.persistence.storageKey);
    // } catch (error) {
    //   console.warn('Failed to clear AsyncStorage cache:', error);
    // }

    // Clear secure storage
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    // Reset auth state
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setJustSignedIn(false);
    setIsLoading(false);
  }

  // Computed property for staff status
  const isStaff = user?.is_staff ?? false;

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        user,
        isLoading,
        isAuthenticated,
        needsUsernameSetup,
        justSignedIn,
        isStaff,
        setAuthFromBackend,
        signOut,
        validateStoredCredentials,
        refreshUser,
        updateUserLocally,
        clearJustSignedInFlag,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
