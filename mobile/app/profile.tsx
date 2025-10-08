import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  Switch,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { ThemeMode } from '../lib/settingsStorage';
import { t } from '../lib/i18n';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SettingsCard from '../components/SettingsCard';
import Avatar from '../components/Avatar';
import SocialMediaSection from '../components/SocialMediaSection';
import UsernameSelectionModal from '../components/UsernameSelectionModal';

export default function ProfileScreen() {
  const { user, signOut, isAuthenticated, isLoading } = useAuth();
  const { settings, setNotificationsEnabled } = useSettings();
  const { theme, setTheme, isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Theme options for native selection
  const themeOptions = [
    { value: 'light', label: t('light') },
    { value: 'dark', label: t('dark') },
    { value: 'system', label: t('system') },
  ];

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

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/signin');
  };

  const handleOpenSystemSettings = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Open app-specific settings for language
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open system settings:', error);
    }
  };

  const handleThemeSelection = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...themeOptions.map((opt) => opt.label), t('cancel')],
          cancelButtonIndex: themeOptions.length,
          title: t('theme'),
        },
        (buttonIndex) => {
          if (buttonIndex < themeOptions.length) {
            setTheme(themeOptions[buttonIndex].value as ThemeMode);
          }
        }
      );
    } else {
      // For Android, show a simple alert with options
      Alert.alert(t('theme'), t('themeDescription'), [
        ...themeOptions.map((option) => ({
          text: option.label,
          onPress: () => setTheme(option.value as ThemeMode),
        })),
        { text: t('cancel'), style: 'cancel' },
      ]);
    }
  };

  const getCurrentThemeLabel = () => {
    const option = themeOptions.find((opt) => opt.value === theme);
    return option?.label || t('system');
  };

  const handleUsernamePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Open modal to set username
    setShowUsernameModal(true);
  };

  const handleUsernameComplete = async () => {
    // Close modal immediately (user data already updated locally in modal)
    setShowUsernameModal(false);
  };

  const handleUsernameCancel = () => {
    // Close modal immediately
    setShowUsernameModal(false);
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <View className='flex-1 justify-center items-center'>
          <Text style={{ color: colors.foreground }}>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
        {/* Header */}
        {isAuthenticated && user ? (
          <View className='items-center mb-12 mt-8'>
            <Avatar
              size={100}
              firstName={user.first_name}
              lastName={user.last_name}
              email={user.email}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{ color: colors.foreground }}
              className='text-2xl font-bold text-center mb-1'
            >
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || user.email}
            </Text>
            {user.email && (
              <Text
                style={{ color: colors.mutedForeground }}
                className='text-sm text-center'
              >
                {user.email}
              </Text>
            )}
          </View>
        ) : (
          /* Sign In Section for non-authenticated users */
          <View className='mb-8 mt-8'>
            <TouchableOpacity
              onPress={handleSignIn}
              className='rounded-[14px] overflow-hidden active:opacity-80'
              onPressIn={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(32, 102, 223, 0.32)', 'rgba(236, 46, 129, 0.32)']
                    : ['rgba(32, 102, 223, 0.5)', 'rgba(236, 46, 129, 0.5)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 14, padding: 1 }}
              >
                <View
                  className='rounded-[13px] py-4 px-4 items-center justify-center border border-transparent'
                  style={{
                    backgroundColor: colors.card,
                  }}
                >
                  <View className='flex-row items-center'>
                    <Feather
                      name='log-in'
                      size={20}
                      color={colors.foreground}
                    />
                    <Text
                      style={{ color: colors.foreground }}
                      className='font-medium text-base ml-3'
                    >
                      {t('signIn')}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Section */}
        <View className='mb-8'>
          <Text
            style={{ color: colors.foreground }}
            className='text-xl font-semibold mb-4'
          >
            {t('settings')}
          </Text>

          {/* Username Setting - always visible but only clickable if not set by user */}
          {isAuthenticated && user && (
            <SettingsCard
              title='Username'
              description={
                user.username
                  ? `@${user.username}`
                  : 'Set your unique username'
              }
              icon='at-sign'
              onPress={user.username_set_by_user ? undefined : handleUsernamePress}
              rightElement={
                !user.username_set_by_user && (
                  <Feather
                    name='chevron-right'
                    size={20}
                    color={colors.foreground}
                  />
                )
              }
              showChevron={false}
              disabled={user.username_set_by_user}
            />
          )}

          {/* Notifications Setting */}
          <SettingsCard
            title={t('notifications')}
            description={t('notificationsDescription')}
            icon='bell'
            rightElement={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E7EB', true: '#2066DF' }}
                thumbColor='#FFFFFF'
                ios_backgroundColor='#E5E7EB'
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            }
            showChevron={false}
          />

          {/* Language Setting */}
          <SettingsCard
            title={t('language')}
            description={t('languageDescription')}
            icon='globe'
            onPress={handleOpenSystemSettings}
            rightElement={
              <Feather
                name='external-link'
                size={20}
                color={colors.foreground}
              />
            }
            showChevron={false}
          />

          {/* Theme Setting */}
          <SettingsCard
            title={t('theme')}
            description={t('themeDescription')}
            icon='moon'
            onPress={handleThemeSelection}
            rightElement={
              <View className='flex-row items-center'>
                <Text
                  style={{ color: colors.foreground }}
                  className='font-medium mr-2'
                >
                  {getCurrentThemeLabel()}
                </Text>
                <Feather
                  name='chevron-right'
                  size={20}
                  color={colors.foreground}
                />
              </View>
            }
            showChevron={false}
          />
        </View>

        {/* Social Media Section */}
        <View className='mb-8'>
          <SocialMediaSection />
        </View>

        {/* Sign Out Section for authenticated users */}
        {isAuthenticated && (
          <View className='mb-8'>
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                borderColor: colors.destructive,
                backgroundColor: colors.card,
              }}
              className='border rounded-[14px] px-4 py-4 items-center active:opacity-80'
              onPressIn={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
            >
              <View className='flex-row items-center'>
                <Feather name='log-out' size={24} color={colors.destructive} />
                <Text
                  style={{ color: colors.destructive }}
                  className='font-semibold text-lg ml-3'
                >
                  {t('signOut')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing */}
        <View className='h-8' />
      </ScrollView>

      {/* Username Selection Modal */}
      {isAuthenticated && (
        <UsernameSelectionModal
          visible={showUsernameModal}
          onComplete={handleUsernameComplete}
          onCancel={handleUsernameCancel}
          dismissible={true}
        />
      )}
    </View>
  );
}
