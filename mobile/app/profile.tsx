import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../lib/i18n';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, signOut, isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/signin');
    }
  }, [isLoading, isAuthenticated]);

  const handleSignOut = async () => {
    try {
      Alert.alert(t('signOut'), t('areYouSureSignOut'), [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
            router.replace('/');
          },
        },
      ]);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(t('error'), t('signOutError'));
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          // paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <View className='flex-1 justify-center items-center'>
          <Text className='text-black dark:text-white'>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        // paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View className='flex-1 px-6 pt-12'>
        {/* User Avatar and Info */}
        <View className='items-center mb-16'>
          <View className='w-32 h-32 bg-blue-500 rounded-full items-center justify-center mb-6 shadow-lg'>
            <Text className='text-white text-4xl font-bold'>
              {user.first_name?.charAt(0)?.toUpperCase() ||
                user.email?.charAt(0)?.toUpperCase() ||
                'U'}
            </Text>
          </View>

          <Text className='text-3xl font-bold text-black dark:text-white text-center mb-2'>
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.email || t('user')}
          </Text>

          {user.email && (
            <Text className='text-lg text-gray-600 dark:text-gray-400 text-center'>
              {user.email}
            </Text>
          )}
        </View>

        {/* Spacer to push sign out button to bottom area */}
        <View className='flex-1' />

        {/* Sign Out Button */}
        <View className='pb-8 items-center'>
          <TouchableOpacity
            onPress={handleSignOut}
            className='border border-red-500 dark:border-red-400 rounded-[14px] px-4 py-3 items-center active:bg-red-50 dark:active:bg-red-900/20'
            onPressIn={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <View className='flex-row items-center'>
              <Feather
                name='log-out'
                size={24}
                color={isDark ? '#F87171' : '#EF4444'}
              />
              <Text className='text-red-500 dark:text-red-400 font-semibold text-lg ml-3'>
                {t('signOut')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
