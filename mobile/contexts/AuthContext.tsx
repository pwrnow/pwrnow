import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateToken, refreshAccessToken, logout } from '../lib/api';
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
            const { userApi } = await import('../lib/api');
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
          // Try refresh once if we have a refresh token
          if (r) {
            const newAccess = await refreshAccessToken();
            if (newAccess) {
              try {
                await validateToken(newAccess);
                setAccessToken(newAccess);
                setRefreshToken(r);
                setIsAuthenticated(true);
                
                // Fetch fresh user details from /user/ endpoint
                try {
                  const { userApi } = await import('../lib/api');
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
          } else {
            await signOut();
          }
        }
      } else {
        // No stored credentials, user is not authenticated
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error validating stored credentials:', error);
      setIsAuthenticated(false);
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
      const { userApi } = await import('../lib/api');
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
