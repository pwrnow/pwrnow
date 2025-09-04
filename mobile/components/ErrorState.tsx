import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';

interface ErrorStateProps {
  title: string;
  message: string;
  buttonText?: string;
  onButtonPress?: () => void;
  showBackButton?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = React.memo(
  ({
    title,
    message,
    buttonText = t('backToHome'),
    onButtonPress,
    showBackButton = true,
  }) => {
    const { colors } = useThemeColors();
    const router = useRouter();

    const handleButtonPress = onButtonPress || (() => router.replace('/'));

    return (
      <View className='flex-1 justify-center items-center px-6'>
        <Feather name='alert-circle' size={64} color={colors.mutedForeground} />
        <Text
          style={{ color: colors.foreground }}
          className='text-center text-xl font-groteskSemibold mb-2 mt-4'
        >
          {title}
        </Text>
        <Text
          style={{ color: colors.mutedForeground }}
          className='text-center mb-6'
        >
          {message}
        </Text>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleButtonPress}
            style={{ backgroundColor: colors.primary }}
            className='px-6 py-3 rounded-xl'
          >
            <Text
              style={{ color: colors.primaryForeground }}
              className='font-semibold'
            >
              {buttonText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

export default ErrorState;
