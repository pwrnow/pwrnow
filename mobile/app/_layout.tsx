import '../global.css';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, TouchableOpacity } from 'react-native';
import { NotificationsProvider } from '../providers/notifications';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/Logo';
import * as Haptics from 'expo-haptics';
import { PosthogProvider } from '../providers/posthog';
import { QueryProvider } from '../providers/query';
import StartupAnimation from '../components/StartupAnimation';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

let hasShownStartupOnce = false;

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
        <NotificationsProvider enabled={!showStartup}>
          <QueryProvider>
            <PosthogProvider>
              {/* Startup overlay animation shown briefly after splash */}
              <StartupAnimation
                visible={showStartup}
                onEnd={handleStartupEnd}
              />
              <StatusBar
                style={isDark ? 'light' : 'dark'}
                animated
                translucent={false}
                backgroundColor={isDark ? '#000000' : '#FFFFFF'}
              />
              <RootNavigator />
            </PosthogProvider>
          </QueryProvider>
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Separate this into a new component so it can access the AuthContext
function RootNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        },
        // Use a slightly off-white tint in dark mode so the back icon isn't pure white
        headerTintColor: isDark ? '#E5E7EB' : '#000000',
        contentStyle: { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
      }}
    >
      {/* Protected Routes - Only for authenticated users */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen
          name='profile'
          options={{
            title: 'Profile',
            headerShown: true,
          }}
        />
      </Stack.Protected>

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuth();

  const handlePress = () => {
    Haptics.selectionAsync();
    if (isAuthenticated) {
      router.push('/profile');
    } else {
      router.push('/signin');
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TouchableOpacity
        accessibilityLabel={isAuthenticated ? 'Open profile' : 'Sign in'}
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
