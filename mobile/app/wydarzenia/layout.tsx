import { Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useColorScheme, View, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Logo from '../../components/Logo';

export default function WydarzeniaLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerLeft: () => (
          <View style={{ marginLeft: Platform.OS === 'ios' ? -12 : 0 }}>
            <Logo size='medium' />
          </View>
        ),
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerTransparent: true,
        headerBlurEffect: 'regular',
        headerBackground: () => (
          <BlurView
            intensity={24}
            tint={isDark ? 'dark' : 'light'}
            style={{ flex: 1 }}
          />
        ),
        headerStyle: { backgroundColor: 'transparent' },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
      }}
    />
  );
}
