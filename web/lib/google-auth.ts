/**
 * Google OAuth authentication service for the web frontend.
 */

import { getApiUrl } from './config';

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
 * Service class for handling Google OAuth authentication on the web.
 */
export class GoogleAuthService {
  private static readonly STORAGE_KEY_ACCESS_TOKEN = 'auth_access_token';
  private static readonly STORAGE_KEY_REFRESH_TOKEN = 'auth_refresh_token';
  private static readonly STORAGE_KEY_USER = 'auth_user';

  /**
   * Authenticate user with Google OAuth ID token.
   */
  static async authenticateWithGoogle(
    idToken: string,
    platform: 'web' | 'mobile' = 'web'
  ): Promise<GoogleAuthResponse> {
    const response = await fetch(`${getApiUrl()}/v1/auth/google/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        id_token: idToken,
        platform,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    // Store tokens and user data
    this.storeAuthData(data.tokens, data.user);

    return data;
  }

  /**
   * Initialize Google OAuth for web.
   */
  static async initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Google Identity Services script
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth can only be initialized in browser'));
        return;
      }

      // Check if already loaded
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Initiate Google Sign-In flow.
   */
  static async signInWithGoogle(): Promise<GoogleAuthResponse> {
    await this.initializeGoogleAuth();

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    return new Promise((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const authResponse = await this.authenticateWithGoogle(response.credential);
            resolve(authResponse);
          } catch (error) {
            reject(error);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Prompt the user to sign in
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Try alternative sign-in method
          window.google.accounts.id.renderButton(
            document.createElement('div'),
            {
              theme: 'outline',
              size: 'large',
              type: 'standard',
            }
          );
        }
      });
    });
  }

  /**
   * Refresh authentication tokens.
   */
  static async refreshTokens(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${getApiUrl()}/v1/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Clear stored tokens on refresh failure
      this.clearAuthData();
      throw new Error(data.error || 'Token refresh failed');
    }

    // Update stored tokens
    this.storeTokens(data);

    return data;
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
    this.storeUser(updatedUser);
    
    return updatedUser;
  }

  /**
   * Logout user.
   */
  static async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    try {
      await this.authenticatedRequest('/v1/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
    
    // Clear local storage
    this.clearAuthData();
    
    // Sign out from Google
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  /**
   * Check if user is authenticated.
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  }

  /**
   * Get stored access token.
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.STORAGE_KEY_ACCESS_TOKEN);
  }

  /**
   * Get stored refresh token.
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.STORAGE_KEY_REFRESH_TOKEN);
  }

  /**
   * Get stored user data.
   */
  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.STORAGE_KEY_USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Make authenticated request to API.
   */
  static async authenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let accessToken = this.getAccessToken();

    const makeRequest = async (token: string) => {
      return fetch(`${getApiUrl()}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        credentials: 'include',
      });
    };

    let response = await makeRequest(accessToken!);

    // If token is expired, try to refresh
    if (response.status === 401 && this.getRefreshToken()) {
      try {
        const newTokens = await this.refreshTokens();
        accessToken = newTokens.access;
        response = await makeRequest(accessToken);
      } catch (error) {
        // Refresh failed, user needs to re-authenticate
        this.clearAuthData();
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
   * Store authentication data.
   */
  private static storeAuthData(tokens: AuthTokens, user: User): void {
    this.storeTokens(tokens);
    this.storeUser(user);
  }

  /**
   * Store tokens.
   */
  private static storeTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY_ACCESS_TOKEN, tokens.access);
    localStorage.setItem(this.STORAGE_KEY_REFRESH_TOKEN, tokens.refresh);
  }

  /**
   * Store user data.
   */
  private static storeUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(user));
  }

  /**
   * Clear all authentication data.
   */
  private static clearAuthData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY_ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEY_REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEY_USER);
  }
}

// Type declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}