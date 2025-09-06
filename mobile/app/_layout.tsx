import '../global.css';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { NotificationsProvider } from '../providers/notifications';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/Logo';
import * as Haptics from 'expo-haptics';
import { PosthogProvider } from '../providers/posthog';
import { QueryProvider } from '../providers/query';
import StartupAnimation from '../components/StartupAnimation';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { focusManager, useQueryClient } from '@tanstack/react-query';

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
                <PosthogProvider>
                  {/* Startup overlay animation shown briefly after splash */}
                  <StartupAnimation
                    visible={showStartup}
                    onEnd={handleStartupEnd}
                  />
                  <ThemedApp />
                </PosthogProvider>
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
  const queryClient = useQueryClient();

  async function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active');
    }
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [queryClient]);

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        animated
        translucent={false}
        backgroundColor={colors.background}
      />
      <RootNavigator />
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
          headerShown: true,
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
    </Stack>
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
