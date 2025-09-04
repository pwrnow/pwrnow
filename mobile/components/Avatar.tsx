import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface AvatarProps {
  size?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  imageUri?: string;
  style?: any;
}

export default function Avatar({
  size = 80,
  firstName,
  lastName,
  email,
  imageUri,
  style,
}: AvatarProps) {
  const { colors } = useTheme();

  // Generate initials from first and last name, or from email
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName
        .charAt(0)
        .toUpperCase()}`;
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Generate gradient colors using app accent colors
  const getGradientColors = () => {
    const initials = getInitials();
    const hash = initials.charCodeAt(0) + initials.charCodeAt(1);

    // Use app accent colors with variations
    const gradients = [
      [colors.primary, colors.accent],
      [colors.accent, colors.primary],
      [`${colors.primary}CC`, `${colors.accent}CC`], // With opacity
      [`${colors.accent}CC`, `${colors.primary}CC`], // With opacity
    ];

    return gradients[hash % gradients.length];
  };

  const initials = getInitials();
  const gradientColors = getGradientColors();

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          resizeMode='cover'
        />
      ) : (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: size * 0.4,
                color: '#FFFFFF',
              },
            ]}
          >
            {initials}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderWidth: 0,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 2,
    // borderColor: '#FFFFFF',
  },
  initials: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
