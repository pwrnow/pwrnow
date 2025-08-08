import React from 'react';
import { View, SafeAreaView, TouchableOpacity } from 'react-native';
import Logo from './Logo';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
  logoSize?: 'small' | 'medium' | 'large';
  onBack?: () => void;
}

export default function Header({ logoSize = 'medium', onBack }: HeaderProps) {
  return (
    <SafeAreaView className='bg-black px-4 pt-2 pb-3 border-b border-[#1F1F1F]'>
      <View className='flex-row items-center justify-between mb-2'>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            className='p-2 rounded-full bg-white/5'
          >
            <Feather name='arrow-left' size={22} color={'#FFFFFF'} />
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
