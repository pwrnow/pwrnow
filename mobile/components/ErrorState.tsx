import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { t } from '../lib/i18n';

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
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const handleButtonPress = onButtonPress || (() => router.replace('/'));

    return (
      <View className='flex-1 justify-center items-center px-6'>
        <Feather
          name='alert-circle'
          size={64}
          color={isDark ? '#6B7280' : '#9CA3AF'}
        />
        <Text className='text-black dark:text-white text-center text-xl font-groteskSemibold mb-2 mt-4'>
          {title}
        </Text>
        <Text className='text-black/60 dark:text-white/60 text-center mb-6'>
          {message}
        </Text>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleButtonPress}
            className='bg-accentBlue px-6 py-3 rounded-xl'
          >
            <Text className='text-white font-semibold'>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

export default ErrorState;
