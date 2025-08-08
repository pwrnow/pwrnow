import React from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Logo from './Logo';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
  logoSize?: 'small' | 'medium' | 'large';
  onBack?: () => void;
}

export default function Header({ logoSize = 'medium', onBack }: HeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconPrimary = isDark ? '#FFFFFF' : '#000000';
  return (
    <SafeAreaView className='bg-white dark:bg-black px-3 pt-2 pb-3 border-b border-black/10 dark:border-[#1F1F1F]'>
      <View className='flex-row items-center justify-between mb-2'>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            className='p-2 rounded-full bg-black/5 dark:bg-white/5'
          >
            <Feather name='arrow-left' size={22} color={iconPrimary} />
          </TouchableOpacity>
        ) : (
          <View className='w-[38px]' />
        )}

        <View className='w-[38px]' />
      </View>

      {/* Centered logo */}
      <View className='items-center pb-2'>
        <Logo size={logoSize} />
      </View>
    </SafeAreaView>
  );
}
