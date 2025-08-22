/**
 * Mobile authentication service with secure token storage.
 * Handles Google OAuth authentication and secure storage for React Native/Expo.
 */

import { GoogleSignin, User as GoogleUser } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  auth_provider: 'email' | 'google';
  is_google_verified: boolean;
  date_joined: string;
  last_login?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface GoogleAuthResponse {
  user: User;
  tokens: AuthTokens;
  message?: string;
}

export interface GoogleAuthError {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

/**
 * Mobile authentication service class.
 */
export class MobileAuthService {
  private static readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER_DATA: 'auth_user_data',
    GOOGLE_TOKEN: 'google_id_token',
  };

  private static readonly API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  /**
   * Initialize Google Sign-In and check authentication status.
   */
  static async initialize(): Promise<void> {
    try {
      // Check if Google Play Services are available (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      // Check if user is already signed in to Google
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        console.log('User is already signed in to Google');
      }
    } catch (error) {
      console.warn('Failed to initialize mobile auth service:', error);
    }
  }

  /**
   * Sign in with Google OAuth.
   */
  static async signInWithGoogle(): Promise<GoogleAuthResponse> {
    try {
      // Check Google Play Services availability
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      // Get Google user info
      const googleUser = await GoogleSignin.signIn();
      
      if (!googleUser.idToken) {
        throw new Error('Failed to get Google ID token');
      }

      // Authenticate with backend
      const authResponse = await this.authenticateWithBackend(googleUser.idToken);

      // Store authentication data securely
      await this.storeAuthData(authResponse.tokens, authResponse.user);
      
      // Store Google token for future use
      await this.storeGoogleToken(googleUser.idToken);

      return authResponse;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out user.
   */
  static async signOut(): Promise<void> {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Clear stored data
      await this.clearAuthData();
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
      // Clear data anyway
      await this.clearAuthData();
    }
  }

  /**
   * Refresh authentication tokens.
   */
  static async refreshTokens(): Promise<AuthTokens> {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.API_BASE_URL}/v1/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      // Store new tokens
      await this.storeTokens(data);

      return data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Get current user profile.
   */
  static async getUserProfile(): Promise<User> {
    const response = await this.authenticatedRequest('/v1/auth/user/profile/');
    return response.json();
  }

  /**
   * Update user profile.
   */
  static async updateUserProfile(userData: Partial<User>): Promise<User> {
    const response = await this.authenticatedRequest('/v1/auth/user/profile/', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    
    const updatedUser = await response.json();
    await this.storeUser(updatedUser);
    
    return updatedUser;
  }

  /**
   * Check if user is authenticated.
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const user = await this.getUser();
      return !!(accessToken && user);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get stored user data.
   */
  static async getUser(): Promise<User | null> {
    try {
      const userData = await this.getSecureItem(this.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Get stored access token.
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await this.getSecureItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token.
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await this.getSecureItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Make authenticated request to API.
   */
  static async authenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let accessToken = await this.getAccessToken();

    const makeRequest = async (token: string) => {
      return fetch(`${this.API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    };

    let response = await makeRequest(accessToken!);

    // If token is expired, try to refresh
    if (response.status === 401) {
      try {
        const newTokens = await this.refreshTokens();
        accessToken = newTokens.access;
        response = await makeRequest(accessToken);
      } catch (error) {
        // Refresh failed, user needs to re-authenticate
        await this.clearAuthData();
        throw new Error('Session expired. Please sign in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response;
  }

  /**
   * Authenticate with backend using Google ID token.
   */
  private static async authenticateWithBackend(idToken: string): Promise<GoogleAuthResponse> {
    const response = await fetch(`${this.API_BASE_URL}/v1/auth/google/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_token: idToken,
        platform: 'mobile',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    return data;
  }

  /**
   * Store authentication data securely.
   */
  private static async storeAuthData(tokens: AuthTokens, user: User): Promise<void> {
    await Promise.all([
      this.storeTokens(tokens),
      this.storeUser(user),
    ]);
  }

  /**
   * Store tokens securely.
   */
  private static async storeTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      this.setSecureItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.access),
      this.setSecureItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh),
    ]);
  }

  /**
   * Store user data.
   */
  private static async storeUser(user: User): Promise<void> {
    await this.setSecureItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  /**
   * Store Google token.
   */
  private static async storeGoogleToken(token: string): Promise<void> {
    await this.setSecureItem(this.STORAGE_KEYS.GOOGLE_TOKEN, token);
  }

  /**
   * Clear all authentication data.
   */
  private static async clearAuthData(): Promise<void> {
    await Promise.all([
      this.deleteSecureItem(this.STORAGE_KEYS.ACCESS_TOKEN),
      this.deleteSecureItem(this.STORAGE_KEYS.REFRESH_TOKEN),
      this.deleteSecureItem(this.STORAGE_KEYS.USER_DATA),
      this.deleteSecureItem(this.STORAGE_KEYS.GOOGLE_TOKEN),
    ]);
  }

  /**
   * Securely store item using Expo SecureStore or AsyncStorage as fallback.
   */
  private static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (SecureStore.isAvailableAsync()) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      throw error;
    }
  }

  /**
   * Securely retrieve item using Expo SecureStore or AsyncStorage as fallback.
   */
  private static async getSecureItem(key: string): Promise<string | null> {
    try {
      if (SecureStore.isAvailableAsync()) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Securely delete item using Expo SecureStore or AsyncStorage as fallback.
   */
  private static async deleteSecureItem(key: string): Promise<void> {
    try {
      if (SecureStore.isAvailableAsync()) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
    }
  }

  /**
   * Handle authentication errors.
   */
  private static handleAuthError(error: any): Error {
    if (error.code === 'SIGN_IN_CANCELLED') {
      return new Error('Sign-in was cancelled by user');
    }
    
    if (error.code === 'IN_PROGRESS') {
      return new Error('Sign-in is already in progress');
    }
    
    if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return new Error('Google Play Services not available');
    }

    return new Error(error.message || 'Authentication failed');
  }
}