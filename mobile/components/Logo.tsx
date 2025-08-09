import React from 'react';
import { Image, View } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function Logo({ size = 'medium' }: LogoProps) {
  const sizeMap = {
    small: 20,
    medium: 28,
    large: 36,
  } as const;

  const logoHeight = sizeMap[size];
  const logoWidth = Math.round(logoHeight * (160 / 48)); // approximate logo aspect

  return (
    <View className='flex-row items-center'>
      <Image
        source={require('../assets/logo.png')}
        style={{ width: logoWidth, height: logoHeight }}
        resizeMode='contain'
      />
    </View>
  );
}
