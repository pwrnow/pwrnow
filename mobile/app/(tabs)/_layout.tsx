import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { t } from '../../lib/i18n';

export default function TabsLayout() {
  if (Platform.OS === 'ios') {
    return <IOSNativeTabs />;
  }
  return <AndroidTabs />;
}

function IOSNativeTabs() {
  const { isStaff } = useAuth();

  return (
    <NativeTabs minimizeBehavior="automatic" sidebarAdaptable={false}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>{t('home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="liked">
        <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} />
        <NativeTabs.Trigger.Label>{t('liked')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <NativeTabs.Trigger.Label>{t('friends')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="admin" hidden={!isStaff}>
        <NativeTabs.Trigger.Icon sf={{ default: 'shield', selected: 'shield.fill' }} />
        <NativeTabs.Trigger.Label>{t('admin')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function AndroidTabs() {
  const { colors, isDark } = useTheme();
  const { isStaff } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#FFFFFF' : '#000000',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: isDark ? '#374151' : '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="liked"
        options={{
          title: t('liked'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('friends'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('admin'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
          href: isStaff ? undefined : null,
        }}
      />
    </Tabs>
  );
}
