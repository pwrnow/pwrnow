import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Colors } from '../constants/Colors';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function Logo({ size = 'medium' }: LogoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = createStyles(colors, size);

  return (
    <View style={styles.container}>
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={styles.logoText}>PWr Now</Text>
          </View>
        }
      >
        <LinearGradient
          colors={[colors.accent, colors.primary, colors.secondary]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </MaskedView>
    </View>
  );
}

const createStyles = (colors: any, size: 'small' | 'medium' | 'large') => {
  const sizeConfig = {
    small: { fontSize: 20, width: 120, height: 28, lineHeight: 24 },
    medium: { fontSize: 30, width: 180, height: 40, lineHeight: 36 }, // 1.875rem = 30px, 2.25rem = 36px
    large: { fontSize: 48, width: 240, height: 56, lineHeight: 56 },
  };

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    maskedView: {
      width: sizeConfig[size].width,
      height: sizeConfig[size].height,
    },
    maskContainer: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoText: {
      fontSize: sizeConfig[size].fontSize,
      lineHeight: sizeConfig[size].lineHeight,
      fontFamily: 'Righteous-Regular',
      textAlign: 'center',
      color: 'black', // This is the mask color
    },
    gradient: {
      flex: 1,
      width: sizeConfig[size].width,
      height: sizeConfig[size].height,
    },
  });
};
