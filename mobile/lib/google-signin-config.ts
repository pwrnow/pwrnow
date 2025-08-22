/**
 * Google Sign-In configuration for React Native.
 * This file sets up the Google OAuth configuration for iOS and Android.
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

export interface GoogleSignInConfig {
  webClientId: string;
  iosClientId?: string;
  androidClientId?: string;
  scopes: string[];
  offlineAccess: boolean;
  hostedDomain?: string;
  forceCodeForRefreshToken?: boolean;
}

/**
 * Default configuration for Google Sign-In.
 */
const defaultConfig: GoogleSignInConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  scopes: ['email', 'profile'],
  offlineAccess: true,
  forceCodeForRefreshToken: true,
};

/**
 * Configure Google Sign-In for the current platform.
 */
export function configureGoogleSignIn(config?: Partial<GoogleSignInConfig>): void {
  const finalConfig = { ...defaultConfig, ...config };

  // Validate required configuration
  if (!finalConfig.webClientId) {
    console.error('Google Sign-In: Web Client ID is required but not provided');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId: finalConfig.webClientId,
      iosClientId: finalConfig.iosClientId,
      scopes: finalConfig.scopes,
      offlineAccess: finalConfig.offlineAccess,
      hostedDomain: finalConfig.hostedDomain,
      forceCodeForRefreshToken: finalConfig.forceCodeForRefreshToken,
    });

    console.log('Google Sign-In configured successfully');
  } catch (error) {
    console.error('Failed to configure Google Sign-In:', error);
  }
}

/**
 * Check if Google Play Services are available (Android only).
 */
export async function checkGooglePlayServices(): Promise<boolean> {
  try {
    await GoogleSignin.hasPlayServices();
    return true;
  } catch (error) {
    console.warn('Google Play Services not available:', error);
    return false;
  }
}

/**
 * Get the current Google Sign-In configuration status.
 */
export function getGoogleSignInStatus(): {
  isConfigured: boolean;
  hasWebClientId: boolean;
  hasNativeClientId: boolean;
} {
  const hasWebClientId = !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const hasNativeClientId = !!(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  );

  return {
    isConfigured: hasWebClientId,
    hasWebClientId,
    hasNativeClientId,
  };
}

/**
 * Platform-specific configuration helpers.
 */
export const GoogleSignInPlatform = {
  /**
   * Get iOS-specific configuration requirements.
   */
  getIOSRequirements(): string[] {
    const requirements: string[] = [];
    
    if (!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
      requirements.push('iOS Client ID not configured');
    }
    
    return requirements;
  },

  /**
   * Get Android-specific configuration requirements.
   */
  getAndroidRequirements(): string[] {
    const requirements: string[] = [];
    
    if (!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
      requirements.push('Android Client ID not configured');
    }
    
    return requirements;
  },

  /**
   * Get current platform.
   */
  getCurrentPlatform(): 'ios' | 'android' | 'unknown' {
    if (Constants.platform?.ios) return 'ios';
    if (Constants.platform?.android) return 'android';
    return 'unknown';
  },
};

/**
 * Initialize Google Sign-In with default configuration.
 * Call this early in your app initialization.
 */
export function initializeGoogleSignIn(): void {
  configureGoogleSignIn();
}

// Auto-initialize if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeGoogleSignIn();
}