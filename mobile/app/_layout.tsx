import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, TouchableOpacity } from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Feather } from '@expo/vector-icons';
import Logo from '../components/Logo';
import * as Haptics from 'expo-haptics';

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
        translucent={false}
        backgroundColor={isDark ? '#000000' : '#FFFFFF'}
      />
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: () => <Logo size='medium' />,
          headerTitleAlign: 'left',
          headerTransparent: false,
          headerShadowVisible: true,
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',

          headerRight: () => (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <TouchableOpacity
                accessibilityLabel='Open profile'
                onPressIn={() => {
                  Haptics.selectionAsync();
                }}
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
