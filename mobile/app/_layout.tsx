import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, TouchableOpacity, Platform } from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/Logo';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loaded, error] = useFonts({
    'Righteous-Regular': require('../assets/fonts/Righteous-Regular.ttf'),
    'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
    'SpaceGrotesk-Light': require('../assets/fonts/SpaceGrotesk-Light.ttf'),
    'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-SemiBold': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
  });

  // Initialize push notifications
  const { expoPushToken, isLoading: pushLoading } = usePushNotifications();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (expoPushToken) {
      console.log('Push notifications initialized with token:', expoPushToken);
    }
  }, [expoPushToken]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        animated
        translucent
        backgroundColor={'transparent'}
      />
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: () => <Logo size='medium' />,
          headerTitleAlign: 'left',
          headerTransparent: true,
          headerShadowVisible: true,
          headerBlurEffect: 'light',

          headerRight: () => (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <TouchableOpacity
                accessibilityLabel='Open profile'
                onPress={() => {}}
                style={{ padding: 6, borderRadius: 9999 }}
              >
                <Feather
                  name='user'
                  size={22}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              </TouchableOpacity>
            </View>
          ),
          contentStyle: { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
        }}
      />
    </>
  );
}
