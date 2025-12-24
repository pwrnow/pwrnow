import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';

interface ProfilePictureFeatureModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ProfilePictureFeatureModal({
  visible,
  onClose,
  onNavigateToProfile,
}: ProfilePictureFeatureModalProps) {
  const { colors, isDark } = useThemeColors();

  // Animation values
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const sparkleScale = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const confettiY = useSharedValue(-50);
  const confettiOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  // Particle animations
  const particle1Scale = useSharedValue(0);
  const particle1Y = useSharedValue(0);
  const particle1X = useSharedValue(0);
  const particle1Opacity = useSharedValue(0);
  const particle2Scale = useSharedValue(0);
  const particle2Y = useSharedValue(0);
  const particle2X = useSharedValue(0);
  const particle2Opacity = useSharedValue(0);
  const particle3Scale = useSharedValue(0);
  const particle3Y = useSharedValue(0);
  const particle3X = useSharedValue(0);
  const particle3Opacity = useSharedValue(0);

  // Trigger haptic feedback
  const triggerHaptics = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);
  };

  // Animate particles
  const animateParticles = () => {
    // Particle 1 - top right
    particle1Scale.value = withSequence(
      withDelay(200, withSpring(1, { damping: 8, stiffness: 200 })),
      withDelay(800, withSpring(0, { damping: 15, stiffness: 300 }))
    );
    particle1Y.value = withTiming(-40, { duration: 1000 });
    particle1X.value = withTiming(30, { duration: 1000 });
    particle1Opacity.value = withSequence(
      withDelay(200, withTiming(1, { duration: 100 })),
      withDelay(600, withTiming(0, { duration: 400 }))
    );

    // Particle 2 - top left
    particle2Scale.value = withSequence(
      withDelay(300, withSpring(1, { damping: 8, stiffness: 200 })),
      withDelay(900, withSpring(0, { damping: 15, stiffness: 300 }))
    );
    particle2Y.value = withTiming(-35, { duration: 1100 });
    particle2X.value = withTiming(-25, { duration: 1100 });
    particle2Opacity.value = withSequence(
      withDelay(300, withTiming(1, { duration: 100 })),
      withDelay(700, withTiming(0, { duration: 500 }))
    );

    // Particle 3 - bottom right
    particle3Scale.value = withSequence(
      withDelay(400, withSpring(1, { damping: 8, stiffness: 200 })),
      withDelay(1000, withSpring(0, { damping: 15, stiffness: 300 }))
    );
    particle3Y.value = withTiming(-30, { duration: 1200 });
    particle3X.value = withTiming(20, { duration: 1200 });
    particle3Opacity.value = withSequence(
      withDelay(400, withTiming(1, { duration: 100 })),
      withDelay(800, withTiming(0, { duration: 600 }))
    );
  };

  // Main animation sequence
  useEffect(() => {
    if (visible) {
      runOnJS(triggerHaptics)();

      // Modal entrance
      modalScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      modalOpacity.value = withTiming(1, { duration: 300 });

      // Icon animation
      iconScale.value = withSequence(
        withDelay(300, withSpring(1.2, { damping: 8, stiffness: 200 })),
        withDelay(200, withSpring(1, { damping: 12, stiffness: 150 }))
      );

      iconRotation.value = withSequence(
        withDelay(300, withSpring(-15, { damping: 15, stiffness: 300 })),
        withDelay(100, withSpring(15, { damping: 15, stiffness: 300 })),
        withDelay(100, withSpring(0, { damping: 12, stiffness: 200 }))
      );

      // Sparkle effect
      sparkleScale.value = withSequence(
        withDelay(500, withSpring(1, { damping: 10, stiffness: 200 })),
        withDelay(300, withSpring(0.8, { damping: 8, stiffness: 150 }))
      );
      sparkleOpacity.value = withSequence(
        withDelay(500, withTiming(1, { duration: 200 })),
        withDelay(800, withTiming(0, { duration: 400 }))
      );

      // Confetti
      confettiY.value = withTiming(0, { duration: 800 });
      confettiOpacity.value = withSequence(
        withDelay(600, withTiming(1, { duration: 200 })),
        withDelay(1000, withTiming(0, { duration: 400 }))
      );

      // Animate particles
      runOnJS(animateParticles)();
    } else {
      // Reset animations
      iconScale.value = 0;
      iconRotation.value = 0;
      sparkleScale.value = 0;
      sparkleOpacity.value = 0;
      confettiY.value = -50;
      confettiOpacity.value = 0;
      modalScale.value = 0.8;
      modalOpacity.value = 0;

      // Reset particles
      particle1Scale.value = 0;
      particle1Y.value = 0;
      particle1X.value = 0;
      particle1Opacity.value = 0;
      particle2Scale.value = 0;
      particle2Y.value = 0;
      particle2X.value = 0;
      particle2Opacity.value = 0;
      particle3Scale.value = 0;
      particle3Y.value = 0;
      particle3X.value = 0;
      particle3Opacity.value = 0;
    }
  }, [visible]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
    opacity: sparkleOpacity.value,
  }));

  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: confettiY.value }],
    opacity: confettiOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const particle1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: particle1Scale.value },
      { translateY: particle1Y.value },
      { translateX: particle1X.value },
    ],
    opacity: particle1Opacity.value,
  }));

  const particle2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: particle2Scale.value },
      { translateY: particle2Y.value },
      { translateX: particle2X.value },
    ],
    opacity: particle2Opacity.value,
  }));

  const particle3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: particle3Scale.value },
      { translateY: particle3Y.value },
      { translateX: particle3X.value },
    ],
    opacity: particle3Opacity.value,
  }));

  const handleTakeMeThere = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onNavigateToProfile();
  };

  const handleMaybeLater = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onClose}
    >
      <View className='flex-1 bg-black/60 justify-center items-center px-6'>
        <Animated.View
          style={[
            modalAnimatedStyle,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: isDark ? '#000' : '#000',
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 20,
            },
          ]}
          className='w-full rounded-3xl border p-8 relative overflow-hidden'
        >
          {/* Background gradient overlay */}
          <LinearGradient
            colors={[`${colors.accent}05`, 'transparent', `${colors.accent}05`]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Confetti background */}
          <Animated.View
            style={[
              confettiAnimatedStyle,
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 100,
              },
            ]}
          >
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: Math.random() * 80,
                  left: Math.random() * screenWidth,
                  width: 4,
                  height: 4,
                  backgroundColor: colors.accent,
                  borderRadius: 2,
                  transform: [{ rotate: `${Math.random() * 360}deg` }],
                }}
              />
            ))}
          </Animated.View>

          {/* Main content */}
          <View className='items-center'>
            {/* Camera/User icon with animations */}
            <View className='relative mb-6'>
              <Animated.View
                style={[
                  iconAnimatedStyle,
                  {
                    backgroundColor: `${colors.accent}15`,
                    borderRadius: 50,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: `${colors.accent}30`,
                  },
                ]}
              >
                <Feather name='camera' size={40} color={colors.accent} />
              </Animated.View>

              {/* Sparkle effects */}
              <Animated.View
                style={[
                  sparkleAnimatedStyle,
                  {
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    width: 20,
                    height: 20,
                    backgroundColor: colors.accent,
                    borderRadius: 10,
                  },
                ]}
              />
              <Animated.View
                style={[
                  sparkleAnimatedStyle,
                  {
                    position: 'absolute',
                    bottom: -5,
                    left: -15,
                    width: 12,
                    height: 12,
                    backgroundColor: colors.accent,
                    borderRadius: 6,
                  },
                ]}
              />

              {/* Floating particles */}
              <Animated.View
                style={[
                  particle1AnimatedStyle,
                  {
                    position: 'absolute',
                    top: 10,
                    right: 10,
                  },
                ]}
              >
                <Feather name='star' size={16} color={colors.accent} />
              </Animated.View>

              <Animated.View
                style={[
                  particle2AnimatedStyle,
                  {
                    position: 'absolute',
                    top: 5,
                    left: 5,
                  },
                ]}
              >
                <Feather name='star' size={12} color={colors.accent} />
              </Animated.View>

              <Animated.View
                style={[
                  particle3AnimatedStyle,
                  {
                    position: 'absolute',
                    bottom: 15,
                    right: 5,
                  },
                ]}
              >
                <Feather name='star' size={14} color={colors.accent} />
              </Animated.View>
            </View>

            {/* NEW badge */}
            <View
              style={{
                backgroundColor: colors.accent,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Text
                style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}
              >
                {t('newTag')}
              </Text>
            </View>

            {/* Title */}
            <Text
              style={{ color: colors.foreground }}
              className='text-2xl font-bold text-center mb-3'
            >
              {t('profilePictureFeatureTitle')}
            </Text>

            {/* Subtitle */}
            <Text
              style={{ color: colors.mutedForeground }}
              className='text-base text-center mb-6 leading-6'
            >
              {t('profilePictureFeatureSubtitle')}
            </Text>

            {/* Benefits list */}
            <View className='w-full mb-8 space-y-4'>
              <View className='flex-row items-start'>
                <View
                  style={{ backgroundColor: `${colors.accent}15` }}
                  className='w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5'
                >
                  <Feather name='user' size={16} color={colors.accent} />
                </View>
                <View className='flex-1'>
                  <Text
                    style={{ color: colors.foreground }}
                    className='font-semibold text-base mb-1'
                  >
                    {t('profilePictureBenefit1Title')}
                  </Text>
                  <Text
                    style={{ color: colors.mutedForeground }}
                    className='text-sm leading-5'
                  >
                    {t('profilePictureBenefit1Description')}
                  </Text>
                </View>
              </View>

              <View className='flex-row items-start'>
                <View
                  style={{ backgroundColor: `${colors.accent}15` }}
                  className='w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5'
                >
                  <Feather name='users' size={16} color={colors.accent} />
                </View>
                <View className='flex-1'>
                  <Text
                    style={{ color: colors.foreground }}
                    className='font-semibold text-base mb-1'
                  >
                    {t('profilePictureBenefit2Title')}
                  </Text>
                  <Text
                    style={{ color: colors.mutedForeground }}
                    className='text-sm leading-5'
                  >
                    {t('profilePictureBenefit2Description')}
                  </Text>
                </View>
              </View>

              <View className='flex-row items-start'>
                <View
                  style={{ backgroundColor: `${colors.accent}15` }}
                  className='w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5'
                >
                  <Feather name='smile' size={16} color={colors.accent} />
                </View>
                <View className='flex-1'>
                  <Text
                    style={{ color: colors.foreground }}
                    className='font-semibold text-base mb-1'
                  >
                    {t('profilePictureBenefit3Title')}
                  </Text>
                  <Text
                    style={{ color: colors.mutedForeground }}
                    className='text-sm leading-5'
                  >
                    {t('profilePictureBenefit3Description')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Take me there button */}
            <TouchableOpacity
              onPress={handleTakeMeThere}
              style={{ backgroundColor: '#EC2E81' }}
              className='w-full py-3 px-6 rounded-xl items-center mb-3'
              activeOpacity={0.85}
            >
              <Text
                style={{ color: '#FFFFFF' }}
                className='font-semibold text-base'
              >
                {t('profilePictureTakeMeThere')}
              </Text>
            </TouchableOpacity>

            {/* Maybe later button */}
            <TouchableOpacity
              onPress={handleMaybeLater}
              className='w-full py-3 px-6 rounded-xl items-center'
              activeOpacity={0.7}
            >
              <Text
                style={{ color: colors.mutedForeground }}
                className='font-medium text-base'
              >
                {t('profilePictureMaybeLater')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}






