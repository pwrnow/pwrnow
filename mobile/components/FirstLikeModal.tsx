import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Dimensions, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';

interface FirstLikeModalProps {
  visible: boolean;
  onClose: () => void;
  eventTitle?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FirstLikeModal({
  visible,
  onClose,
  eventTitle,
}: FirstLikeModalProps) {
  const { colors, isDark } = useThemeColors();

  // Animation values
  const heartScale = useSharedValue(0);
  const heartRotation = useSharedValue(0);
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

      // Heart animation
      heartScale.value = withSequence(
        withDelay(300, withSpring(1.2, { damping: 8, stiffness: 200 })),
        withDelay(200, withSpring(1, { damping: 12, stiffness: 150 }))
      );

      heartRotation.value = withSequence(
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
      heartScale.value = 0;
      heartRotation.value = 0;
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

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heartScale.value },
      { rotate: `${heartRotation.value}deg` },
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

  // Glass colors
  const glassBg = isDark
    ? 'rgba(20, 20, 20, 0.85)'
    : 'rgba(255, 255, 255, 0.9)';
  
  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.08)';

  const iconBg = isDark
    ? 'rgba(236, 46, 129, 0.2)'
    : 'rgba(236, 46, 129, 0.15)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop with blur */}
      <Pressable 
        style={firstLikeStyles.backdrop} 
        onPress={onClose}
      >
        <BlurView
          intensity={isDark ? 20 : 30}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)' },
          ]}
        />
      </Pressable>

      <View style={firstLikeStyles.centeredContainer}>
        <Animated.View
          style={[
            modalAnimatedStyle,
            firstLikeStyles.glassModal,
            {
              shadowColor: '#000000',
              shadowOpacity: isDark ? 0.5 : 0.2,
              shadowRadius: 32,
              shadowOffset: { width: 0, height: 12 },
              elevation: 24,
            },
          ]}
        >
          {/* Glass blur background */}
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: 'hidden' }]}
          />

          {/* Glass tint */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: glassBg, borderRadius: 28 },
            ]}
          />

          {/* Gradient highlight */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.04)']
                : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.7)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          {/* Top specular highlight */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.12)', 'transparent']
                : ['rgba(255, 255, 255, 0.8)', 'transparent']
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.25 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />

          {/* Border */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 28,
                borderWidth: isDark ? 0.5 : 1,
                borderColor: glassBorder,
              },
            ]}
          />

          {/* Background gradient overlay */}
          <LinearGradient
            colors={[`${colors.accent}08`, 'transparent', `${colors.accent}05`]}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
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
            {/* Heart icon with animations */}
            <View className='relative mb-6'>
              <Animated.View
                style={[
                  heartAnimatedStyle,
                  {
                    backgroundColor: `${colors.accent}15`,
                    borderRadius: 50,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: `${colors.accent}30`,
                  },
                ]}
              >
                <Feather name='heart' size={40} color={colors.accent} />
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

            {/* Title */}
            <Text
              style={{ color: colors.foreground }}
              className='text-2xl font-bold text-center mb-3'
            >
              {t('firstLikeTitle')}
            </Text>

            {/* Subtitle */}
            <Text
              style={{ color: colors.mutedForeground }}
              className='text-base text-center mb-6 leading-6'
            >
              {t('firstLikeSubtitle')}
            </Text>

            {/* Benefits list */}
            <View className='w-full mb-8 space-y-4'>
              <View className='flex-row items-start'>
                <View
                  style={{ backgroundColor: `${colors.accent}15` }}
                  className='w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5'
                >
                  <Feather name='bell' size={16} color={colors.accent} />
                </View>
                <View className='flex-1'>
                  <Text
                    style={{ color: colors.foreground }}
                    className='font-semibold text-base mb-1'
                  >
                    {t('firstLikeBenefit1Title')}
                  </Text>
                  <Text
                    style={{ color: colors.mutedForeground }}
                    className='text-sm leading-5'
                  >
                    {t('firstLikeBenefit1Description')}
                  </Text>
                </View>
              </View>

              <View className='flex-row items-start'>
                <View
                  style={{ backgroundColor: `${colors.accent}15` }}
                  className='w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5'
                >
                  <Feather
                    name='message-circle'
                    size={16}
                    color={colors.accent}
                  />
                </View>
                <View className='flex-1'>
                  <Text
                    style={{ color: colors.foreground }}
                    className='font-semibold text-base mb-1'
                  >
                    {t('firstLikeBenefit2Title')}
                  </Text>
                  <Text
                    style={{ color: colors.mutedForeground }}
                    className='text-sm leading-5'
                  >
                    {t('firstLikeBenefit2Description')}
                  </Text>
                </View>
              </View>

              <View className='flex-row items-start'>
                <View
                  style={{ backgroundColor: `${colors.accent}15` }}
                  className='w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5'
                >
                  <Feather name='trending-up' size={16} color={colors.accent} />
                </View>
                <View className='flex-1'>
                  <Text
                    style={{ color: colors.foreground }}
                    className='font-semibold text-base mb-1'
                  >
                    {t('firstLikeBenefit3Title')}
                  </Text>
                  <Text
                    style={{ color: colors.mutedForeground }}
                    className='text-sm leading-5'
                  >
                    {t('firstLikeBenefit3Description')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Glass-style pink button */}
            <TouchableOpacity
              onPress={onClose}
              style={firstLikeStyles.continueButton}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#EC2E81', '#d92872']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
              />
              {/* Top highlight */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.25)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
              />
              <Text style={firstLikeStyles.continueButtonText}>
                {t('firstLikeContinue')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const firstLikeStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glassModal: {
    width: '100%',
    borderRadius: 28,
    padding: 32,
    overflow: 'hidden',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#EC2E81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    position: 'relative',
    zIndex: 1,
  },
});
