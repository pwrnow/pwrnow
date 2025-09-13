import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../hooks/useThemeColors';
import { t } from '../lib/i18n';

const { width, height } = Dimensions.get('window');

export type QRScanState =
  | 'success'
  | 'already_confirmed'
  | 'invalid_qr'
  | 'error'
  | 'processing';

interface QRScanFeedbackProps {
  state: QRScanState;
  message?: string;
  eventTitle?: string;
  onDismiss: () => void;
  visible: boolean;
}

const QRScanFeedback: React.FC<QRScanFeedbackProps> = ({
  state,
  message,
  eventTitle,
  onDismiss,
  visible,
}) => {
  const { colors, isDark } = useThemeColors();

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const checkmarkProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const slideY = useSharedValue(50);

  // State configurations
  const stateConfig = {
    success: {
      icon: 'check-circle',
      color: '#10B981',
      bgColor: '#D1FAE5',
      darkBgColor: '#064E3B',
      title: t('participationConfirmed'),
      haptic: Haptics.NotificationFeedbackType.Success,
    },
    already_confirmed: {
      icon: 'info',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      darkBgColor: '#78350F',
      title: t('alreadyConfirmed'),
      haptic: Haptics.NotificationFeedbackType.Warning,
    },
    invalid_qr: {
      icon: 'x-circle',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      darkBgColor: '#7F1D1D',
      title: t('invalidQRCode'),
      haptic: Haptics.NotificationFeedbackType.Error,
    },
    error: {
      icon: 'alert-circle',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      darkBgColor: '#7F1D1D',
      title: t('error'),
      haptic: Haptics.NotificationFeedbackType.Error,
    },
    processing: {
      icon: 'loader',
      color: colors.primary,
      bgColor: colors.card,
      darkBgColor: colors.card,
      title: t('processing'),
      haptic: null,
    },
  };

  const config = stateConfig[state];

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (config.haptic) {
        Haptics.notificationAsync(config.haptic);
      }

      // Animate in
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 300 });
      slideY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });

      // Icon animation
      iconScale.value = withDelay(
        200,
        withSpring(1, {
          damping: 12,
          stiffness: 200,
        })
      );

      // Success checkmark animation
      if (state === 'success') {
        checkmarkProgress.value = withDelay(
          400,
          withTiming(1, { duration: 600 })
        );
      }

      // Pulse animation for success
      if (state === 'success') {
        pulseScale.value = withSequence(
          withTiming(1.1, { duration: 200 }),
          withTiming(1, { duration: 200 }),
          withTiming(1.05, { duration: 150 }),
          withTiming(1, { duration: 150 })
        );
      }

      // Auto dismiss for success after 3 seconds
      if (state === 'success') {
        const timer = setTimeout(() => {
          dismiss();
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      // Animate out
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      slideY.value = withTiming(50, { duration: 200 });
    }
  }, [visible, state]);

  const dismiss = () => {
    scale.value = withTiming(0, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    slideY.value = withTiming(50, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: slideY.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { scale: state === 'success' ? pulseScale.value : 1 },
    ],
  }));

  const checkmarkStyle = useAnimatedStyle(() => {
    const progress = checkmarkProgress.value;
    return {
      opacity: progress,
      transform: [
        {
          scale: interpolate(
            progress,
            [0, 0.5, 1],
            [0.5, 1.2, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(
      pulseScale.value,
      [1, 1.1],
      [0.3, 0],
      Extrapolate.CLAMP
    ),
  }));

  const renderIcon = () => {
    if (state === 'success') {
      return (
        <View style={styles.iconContainer}>
          {/* Pulse effect */}
          <Animated.View
            style={[
              styles.pulseEffect,
              { backgroundColor: config.color },
              pulseStyle,
            ]}
          />
          {/* Main icon */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { backgroundColor: config.color },
              iconStyle,
            ]}
          >
            <Feather name='check' size={32} color='white' />
          </Animated.View>
          {/* Checkmark animation */}
          <Animated.View style={[styles.checkmarkOverlay, checkmarkStyle]}>
            <View
              style={[styles.checkmarkCircle, { borderColor: config.color }]}
            >
              <Feather name='check' size={16} color={config.color} />
            </View>
          </Animated.View>
        </View>
      );
    }

    if (state === 'processing') {
      return (
        <Animated.View
          style={[
            styles.iconWrapper,
            { backgroundColor: config.color },
            iconStyle,
          ]}
        >
          <Animated.View style={styles.spinner}>
            <Feather name='loader' size={32} color='white' />
          </Animated.View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.iconWrapper,
          { backgroundColor: config.color },
          iconStyle,
        ]}
      >
        <Feather name={config.icon as any} size={32} color='white' />
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <View style={styles.feedbackContainer}>
        <LinearGradient
          colors={
            isDark
              ? [config.darkBgColor, config.darkBgColor]
              : [config.bgColor, config.bgColor]
          }
          style={styles.feedbackCard}
        >
          {renderIcon()}

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {config.title}
            </Text>

            {eventTitle && (
              <Text
                style={[styles.eventTitle, { color: colors.mutedForeground }]}
              >
                {eventTitle}
              </Text>
            )}

            {message && (
              <Text style={[styles.message, { color: colors.mutedForeground }]}>
                {message}
              </Text>
            )}
          </View>

          {state !== 'processing' && (
            <TouchableOpacity
              style={[
                styles.dismissButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={dismiss}
            >
              <Text
                style={[styles.dismissButtonText, { color: colors.background }]}
              >
                {t('ok')}
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  feedbackContainer: {
    width: width * 0.85,
    maxWidth: 400,
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pulseEffect: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  checkmarkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  spinner: {
    transform: [{ rotate: '0deg' }],
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  dismissButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScanFeedback;
