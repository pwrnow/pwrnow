import React from 'react';
import { Text } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function Logo({ size = 'medium' }: LogoProps) {
  return <Text>PWr Now</Text>;
}
