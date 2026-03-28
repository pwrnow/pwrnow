import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';

interface ModalOverlayProps {
  children: React.ReactNode;
  onPress?: () => void;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  style?: object;
}

export default function ModalOverlay({
  children,
  onPress,
  intensity = 80,
  tint = 'dark',
  style,
}: ModalOverlayProps) {
  if (Platform.OS === 'ios') {
    return (
      <Pressable style={[StyleSheet.absoluteFill, style]} onPress={onPress}>
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: 'rgba(0,0,0,0.5)' },
        style,
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}
