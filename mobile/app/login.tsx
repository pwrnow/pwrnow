/**
 * Login screen for mobile app with Google Sign-In integration.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../lib/auth-context';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { isAuthenticated, login, isLoading } = useAuth();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleGoogleSuccess = async (response: any) => {
    try {
      await login(response);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert(
        'Login Failed',
        'An error occurred during login. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google Sign-In failed:', error);
    
    // Don't show alert for user cancellation
    if (error.message.includes('cancelled')) {
      return;
    }
    
    Alert.alert(
      'Sign-In Error',
      error.message || 'Google Sign-In failed. Please try again.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>PwrNow</Text>
          <Text style={styles.tagline}>Discover amazing events</Text>
        </View>

        {/* Illustration/Logo Area */}
        <View style={styles.illustrationContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>📅</Text>
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome!</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to discover and manage events in your area
          </Text>
        </View>

        {/* Sign In Button */}
        <View style={styles.signInContainer}>
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            size="large"
            style={styles.signInButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  signInContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  signInButton: {
    width: width - 48,
    maxWidth: 320,
  },
  footer: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
});