/**
 * Google Sign-In component for React Native mobile app.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MobileAuthService, type GoogleAuthResponse } from '../lib/mobile-auth';
import { checkGooglePlayServices } from '../lib/google-signin-config';

interface GoogleSignInButtonProps {
  onSuccess?: (response: GoogleAuthResponse) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  textStyle?: any;
  loading?: boolean;
}

/**
 * Google Sign-In button component for mobile.
 */
export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  size = 'large',
  style,
  textStyle,
  loading: externalLoading = false,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    checkGoogleServicesAvailability();
  }, []);

  const checkGoogleServicesAvailability = async () => {
    try {
      const available = await checkGooglePlayServices();
      setIsAvailable(available);
    } catch (error) {
      console.warn('Google Services check failed:', error);
      setIsAvailable(false);
    }
  };

  const handleSignIn = async () => {
    if (isLoading || externalLoading || disabled) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await MobileAuthService.signInWithGoogle();
      onSuccess?.(response);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Sign-in failed';
      
      Alert.alert(
        'Sign-In Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
      
      onError?.(error instanceof Error ? error : new Error('Sign-in failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonSize = () => {
    const { width } = Dimensions.get('window');
    switch (size) {
      case 'small':
        return { width: Math.min(200, width * 0.6), height: 40 };
      case 'medium':
        return { width: Math.min(250, width * 0.7), height: 48 };
      case 'large':
      default:
        return { width: Math.min(300, width * 0.8), height: 56 };
    }
  };

  const buttonSize = getButtonSize();
  const showLoading = isLoading || externalLoading;

  if (!isAvailable) {
    return (
      <View style={[styles.button, styles.disabledButton, buttonSize, style]}>
        <Text style={[styles.buttonText, styles.disabledText, textStyle]}>
          Google Services Unavailable
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonSize,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={handleSignIn}
      disabled={disabled || showLoading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {showLoading ? (
          <ActivityIndicator size=\"small\" color=\"#757575\" style={styles.icon} />
        ) : (
          <GoogleIcon style={styles.icon} />
        )}
        <Text style={[styles.buttonText, disabled && styles.disabledText, textStyle]}>
          {showLoading ? 'Signing in...' : 'Sign in with Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Google icon component.
 */
function GoogleIcon({ style }: { style?: any }) {
  return (
    <View style={[styles.googleIcon, style]}>
      <Text style={styles.googleIconText}>G</Text>
    </View>
  );
}

/**
 * Hook for managing Google authentication state in mobile app.
 */
export function useGoogleAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    initializeMobileAuth();
  }, []);

  const initializeMobileAuth = async () => {
    try {
      await MobileAuthService.initialize();
    } catch (error) {
      console.error('Failed to initialize mobile auth:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      const authenticated = await MobileAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userData = await MobileAuthService.getUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
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
      setIsLoading(true);
      await MobileAuthService.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear state anyway
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: any) => {
    try {
      const updatedUser = await MobileAuthService.updateUserProfile(userData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    updateProfile,
    checkAuthStatus,
  };
}

/**
 * Authentication status component.
 */
interface AuthStatusProps {
  user: any;
  onSignOut: () => void;
  style?: any;
}

export function AuthStatus({ user, onSignOut, style }: AuthStatusProps) {
  if (!user) {
    return null;
  }

  return (
    <View style={[styles.authStatus, style]}>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userName}>
          {user.first_name} {user.last_name}
        </Text>
      </View>
      <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  disabledButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e8eaed',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3c4043',
    marginLeft: 8,
    fontFamily: 'Roboto-Medium',
  },
  disabledText: {
    color: '#9aa0a6',
  },
  icon: {
    width: 18,
    height: 18,
  },
  googleIcon: {
    width: 18,
    height: 18,
    backgroundColor: '#4285f4',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Roboto-Bold',
  },
  authStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 8,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    color: '#5f6368',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ea4335',
    borderRadius: 4,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});