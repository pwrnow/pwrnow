'use client';

import React, { useState, useEffect } from 'react';
import { GoogleAuthService, type GoogleAuthResponse } from '@/lib/google-auth';

interface GoogleSignInButtonProps {
  onSuccess?: (response: GoogleAuthResponse) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'small' | 'medium' | 'large';
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Google Sign-In button component that handles OAuth authentication.
 */
export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  theme = 'outline',
  size = 'large',
  text = 'signin_with',
  className = '',
  children,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Initialize Google OAuth when component mounts
    initializeGoogle();
  }, []);

  const initializeGoogle = async () => {
    try {
      await GoogleAuthService.initializeGoogleAuth();
      setIsGoogleLoaded(true);
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      onError?.(new Error('Failed to load Google authentication'));
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isGoogleLoaded || isLoading || disabled) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await GoogleAuthService.signInWithGoogle();
      onSuccess?.(response);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      onError?.(error instanceof Error ? error : new Error('Sign-in failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Custom button implementation
  if (children) {
    return (
      <button
        onClick={handleGoogleSignIn}
        disabled={disabled || isLoading || !isGoogleLoaded}
        className={className}
        type=\"button\"
      >
        {isLoading ? 'Signing in...' : children}
      </button>
    );
  }

  // Default Google-styled button
  return (
    <div className={`google-signin-container ${className}`}>
      {!isGoogleLoaded ? (
        <div className=\"flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md bg-gray-100\">
          <div className=\"animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600\"></div>
          <span className=\"text-gray-600\">Loading...</span>
        </div>
      ) : (
        <GoogleSignInButtonNative
          onSuccess={handleGoogleSignIn}
          disabled={disabled || isLoading}
          theme={theme}
          size={size}
          text={text}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

interface GoogleSignInButtonNativeProps {
  onSuccess: () => void;
  disabled: boolean;
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'small' | 'medium' | 'large';
  text: 'signin_with' | 'signup_with' | 'continue_with';
  isLoading: boolean;
}

/**
 * Native Google Sign-In button using Google Identity Services.
 */
function GoogleSignInButtonNative({
  onSuccess,
  disabled,
  theme,
  size,
  text,
  isLoading,
}: GoogleSignInButtonNativeProps) {
  const buttonRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buttonRef.current || disabled || isLoading) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) {
      return;
    }

    // Clear any existing button content
    buttonRef.current.innerHTML = '';

    // Render Google button
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme,
      size,
      text,
      type: 'standard',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: size === 'large' ? 300 : size === 'medium' ? 240 : 180,
      click_listener: onSuccess,
    });
  }, [onSuccess, disabled, theme, size, text, isLoading]);

  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-md bg-white\">
        <div className=\"animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600\"></div>
        <span className=\"text-gray-700\">Signing in with Google...</span>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className=\"flex items-center justify-center space-x-2 px-6 py-3 border border-gray-200 rounded-md bg-gray-50 opacity-50 cursor-not-allowed\">
        <svg className=\"w-5 h-5\" viewBox=\"0 0 24 24\">
          <path
            fill=\"#4285f4\"
            d=\"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z\"
          />
          <path
            fill=\"#34a853\"
            d=\"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z\"
          />
          <path
            fill=\"#fbbc05\"
            d=\"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z\"
          />
          <path
            fill=\"#ea4335\"
            d=\"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z\"
          />
        </svg>
        <span className=\"text-gray-400\">Sign in with Google</span>
      </div>
    );
  }

  return <div ref={buttonRef} className=\"google-signin-button\" />;
}

/**
 * Hook for managing Google authentication state.
 */
export function useGoogleAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (GoogleAuthService.isAuthenticated()) {
        const userData = GoogleAuthService.getUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (response: GoogleAuthResponse) => {
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await GoogleAuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear state anyway
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };
}