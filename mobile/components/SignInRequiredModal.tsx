import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';
import GlassModal from './GlassModal';

interface SignInRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

export default function SignInRequiredModal({
  visible,
  onClose,
  onSignIn,
}: SignInRequiredModalProps) {
  const { colors, isDark } = useThemeColors();

  const iconBg = isDark
    ? 'rgba(236, 46, 129, 0.2)'
    : 'rgba(236, 46, 129, 0.15)';

  const buttonGlassBg = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.04)';

  const buttonBorder = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.08)';

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      showCloseButton={false}
      variant="center"
    >
      <View style={styles.container}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Feather name='lock' size={28} color={colors.accent} />
        </View>

        {/* Text */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('signInRequiredTitle')}
        </Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          {t('signInRequiredMessage')}
        </Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Cancel button - glass style */}
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.button,
              {
                backgroundColor: buttonGlassBg,
                borderColor: buttonBorder,
                borderWidth: isDark ? 0.5 : 1,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: colors.foreground }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>

          {/* Sign In button - gradient style */}
          <TouchableOpacity
            onPress={onSignIn}
            style={[styles.button, styles.primaryButton]}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2066DF', '#1a56c4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
              {t('signIn')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryButton: {
    shadowColor: '#2066DF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
