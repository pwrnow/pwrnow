import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { t } from '../lib/i18n';
import * as Haptics from 'expo-haptics';

interface TeamSectionProps {
  style?: any;
}

export default function TeamSection({ style }: TeamSectionProps) {
  const { colors } = useTheme();

  const handleTeamPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const teamUrl = 'https://pwrnow.pl/zespol';
      const canOpen = await Linking.canOpenURL(teamUrl);
      if (canOpen) {
        await Linking.openURL(teamUrl);
      } else {
        Alert.alert(t('error'), t('cannotOpenLink'));
      }
    } catch (error) {
      console.error('Error opening team page:', error);
      Alert.alert(t('error'), t('cannotOpenLink'));
    }
  };

  return (
    <View style={style}>
      <Text
        style={{ color: colors.foreground }}
        className='text-lg font-semibold mb-3'
      >
        {t('team')}
      </Text>

      <TouchableOpacity
        onPress={handleTeamPress}
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
        className='border rounded-[14px] p-4 flex-row items-center justify-between active:opacity-80'
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View className='flex-row items-center flex-1'>
          <View
            style={{
              backgroundColor: colors.muted,
              borderColor: colors.border,
            }}
            className='border rounded-full w-12 h-12 items-center justify-center mr-4'
          >
            <Feather name='users' size={20} color={colors.foreground} />
          </View>
          <View className='flex-1'>
            <Text
              style={{ color: colors.foreground }}
              className='font-medium text-base'
            >
              {t('meetOurTeam')}
            </Text>
            <Text
              style={{ color: colors.mutedForeground }}
              className='text-sm mt-1'
            >
              {t('teamDescription')}
            </Text>
          </View>
        </View>
        <Feather
          name='external-link'
          size={20}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
    </View>
  );
}
