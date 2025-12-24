import '../global.css';
import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { NotificationsProvider } from '../providers/notifications';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/Logo';
import * as Haptics from 'expo-haptics';
import { PosthogProvider } from '../providers/posthog';
import { QueryProvider } from '../providers/query';
import { OfflineProvider } from '../providers/offline';
import StartupAnimation from '../components/StartupAnimation';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { focusManager, useQueryClient } from '@tanstack/react-query';
import ProfilePictureFeatureModal from '../components/ProfilePictureFeatureModal';
import {
  hasSeenProfilePictureFeatureModal,
  markProfilePictureFeatureModalAsSeen,
} from '../lib/profilePictureFeatureStorage';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

let hasShownStartupOnce = false;

export default function StackLayout() {
  const [showStartup, setShowStartup] = useState(() => !hasShownStartupOnce);
  const [loaded, error] = useFonts({
    'Righteous-Regular': require('../assets/fonts/Righteous-Regular.ttf'),
    'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-Light': require('../assets/fonts/SpaceGrotesk-Light.ttf'),
    'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-SemiBold': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
  });

  // Push notifications handled via NotificationsProvider now

  useEffect(() => {
    if (loaded || error) {
      // Immediately hide the native splash, then show our custom startup overlay once
      SplashScreen.hideAsync();
      setShowStartup(!hasShownStartupOnce);
    }
  }, [loaded, error]);

  // Token logging moved inside NotificationsProvider if needed

  const handleStartupEnd = useCallback(() => {
    hasShownStartupOnce = true;
    setShowStartup(false);
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <NotificationsProvider enabled={!showStartup}>
              <QueryProvider>
                <OfflineProvider>
                  <PosthogProvider>
                    {/* Startup overlay animation shown briefly after splash */}
                    <StartupAnimation
                      visible={showStartup}
                      onEnd={handleStartupEnd}
                    />
                    <ThemedApp />
                  </PosthogProvider>
                </OfflineProvider>
              </QueryProvider>
            </NotificationsProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Component that handles theming based on settings
function ThemedApp() {
  const { isDark, colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);

  async function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active');
    }
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [queryClient]);

  // Check if we should show the profile picture feature modal
  useEffect(() => {
    const checkProfilePictureModal = async () => {
      if (isAuthenticated) {
        const hasSeen = await hasSeenProfilePictureFeatureModal();
        if (!hasSeen) {
          // Small delay to let the app settle after authentication
          setTimeout(() => {
            setShowProfilePictureModal(true);
          }, 1000);
        }
      }
    };
    checkProfilePictureModal();
  }, [isAuthenticated]);

  const handleProfilePictureModalClose = async () => {
    await markProfilePictureFeatureModalAsSeen();
    setShowProfilePictureModal(false);
  };

  const handleNavigateToProfile = () => {
    router.push('/profile');
  };

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        animated
        translucent={true}
        backgroundColor="transparent"
      />
      <RootNavigator />
      <ProfilePictureFeatureModal
        visible={showProfilePictureModal}
        onClose={handleProfilePictureModalClose}
        onNavigateToProfile={handleNavigateToProfile}
      />
    </>
  );
}

// Separate this into a new component so it can access the AuthContext
function RootNavigator() {
  const { isDark, colors } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        headerTitle: () => <Logo size='medium' />,
        headerTitleAlign: 'center',
        headerTransparent: false,
        headerShadowVisible: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        // Use a slightly off-white tint in dark mode so the back icon isn't pure white
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Profile screen - accessible to all users */}
      <Stack.Screen
        name='profile'
        options={{
          title: 'Profile',
          headerShown: true,
        }}
      />

      {/* Public Routes - Always accessible */}
      <Stack.Screen
        name='index'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='(tabs)'
        options={{
          headerShown: true,
          // headerLeft: () => <QRScannerHeaderButton />,
          headerRight: () => <ProfileHeaderButton />,
        }}
      />
      <Stack.Screen
        name='signin'
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='wydarzenia/[eventSlug]'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='qr-scanner'
        options={{
          title: 'QR Scanner',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

// QR Scanner button component for header
function QRScannerHeaderButton() {
  const { isDark } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/qr-scanner');
  };

  return (
    <TouchableOpacity
      accessibilityLabel='Open QR Scanner'
      onPressIn={() => {
        Haptics.selectionAsync();
      }}
      onPress={handlePress}
      style={{ padding: 6, borderRadius: 9999 }}
    >
      <Ionicons
        name='qr-code-outline'
        size={24}
        color={isDark ? '#FFFFFF' : '#000000'}
      />
    </TouchableOpacity>
  );
}

// Profile button component for header
function ProfileHeaderButton() {
  const { isDark } = useTheme();

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push('/profile');
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TouchableOpacity
        accessibilityLabel='Open profile'
        onPressIn={() => {
          Haptics.selectionAsync();
        }}
        onPress={handlePress}
        style={{ padding: 6, borderRadius: 9999 }}
      >
        <Feather name='user' size={22} color={isDark ? '#FFFFFF' : '#000000'} />
      </TouchableOpacity>
    </View>
  );
}
