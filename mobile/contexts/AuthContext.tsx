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

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuthFromBackend: (r: any) => Promise<void>;
  signOut: () => Promise<void>;
  validateStoredCredentials: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// Keys for secure storage
// Storage keys moved to lib/authStorage to avoid cyclic deps

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Validate stored credentials on app startup
  async function validateStoredCredentials() {
    try {
      const a = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const r = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const u = await SecureStore.getItemAsync(USER_KEY);

      if (a && u) {
        // We have stored credentials, validate them with backend
        try {
          await validateToken(a);
          setAccessToken(a);
          setRefreshToken(r);
          setUser(JSON.parse(u));
          setIsAuthenticated(true);
        } catch (error) {
          // Try refresh once if we have a refresh token
          if (r) {
            const newAccess = await refreshAccessToken();
            if (newAccess) {
              try {
                await validateToken(newAccess);
                setAccessToken(newAccess);
                setRefreshToken(r);
                setUser(JSON.parse(u!));
                setIsAuthenticated(true);
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
    setIsLoading(false);
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
    try {
      await AsyncStorage.removeItem(queryConfig.persistence.storageKey);
    } catch (error) {
      console.warn('Failed to clear AsyncStorage cache:', error);
    }

    // Clear secure storage
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    // Reset auth state
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
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
        setAuthFromBackend,
        signOut,
        validateStoredCredentials,
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
