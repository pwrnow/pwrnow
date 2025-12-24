import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  variant?: 'center' | 'bottom';
  maxHeight?: number;
}

export default function GlassModal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  variant = 'center',
  maxHeight,
}: GlassModalProps) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Glass colors
  const glassBg = isDark
    ? 'rgba(20, 20, 20, 0.85)'
    : 'rgba(255, 255, 255, 0.9)';

  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.08)';

  const backdropOverlay = isDark
    ? 'rgba(0, 0, 0, 0.6)'
    : 'rgba(0, 0, 0, 0.3)';

  const closeButtonBg = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.05)';

  const isBottom = variant === 'bottom';
  const borderRadius = isBottom ? 28 : 24;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop with blur */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[StyleSheet.absoluteFill]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={isDark ? 20 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: backdropOverlay }]}
          />
        </Pressable>
      </Animated.View>

      {/* Modal content */}
      <View
        style={[
          styles.modalContainer,
          isBottom ? styles.bottomContainer : styles.centerContainer,
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          entering={isBottom ? SlideInDown.springify().damping(20) : FadeIn.duration(250)}
          exiting={isBottom ? SlideOutDown.springify().damping(20) : FadeOut.duration(200)}
          style={[
            styles.glassContainer,
            isBottom
              ? {
                  borderTopLeftRadius: borderRadius,
                  borderTopRightRadius: borderRadius,
                  paddingBottom: insets.bottom + 20,
                  maxHeight: maxHeight ?? SCREEN_HEIGHT * 0.8,
                }
              : {
                  borderRadius: borderRadius,
                  marginHorizontal: 24,
                  maxHeight: maxHeight ?? SCREEN_HEIGHT * 0.85,
                },
            {
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: isDark ? 0.5 : 0.2,
              shadowRadius: 32,
              elevation: 24,
            },
          ]}
        >
          {/* Blur background */}
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFill,
              isBottom
                ? { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }
                : { borderRadius: borderRadius },
              { overflow: 'hidden' },
            ]}
          />

          {/* Glass tint */}
          <View
            style={[
              StyleSheet.absoluteFill,
              isBottom
                ? { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }
                : { borderRadius: borderRadius },
              { backgroundColor: glassBg },
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
            style={[
              StyleSheet.absoluteFill,
              isBottom
                ? { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }
                : { borderRadius: borderRadius },
            ]}
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
            style={[
              StyleSheet.absoluteFill,
              isBottom
                ? { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }
                : { borderRadius: borderRadius },
            ]}
          />

          {/* Border */}
          <View
            style={[
              StyleSheet.absoluteFill,
              isBottom
                ? { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }
                : { borderRadius: borderRadius },
              {
                borderWidth: isDark ? 0.5 : 1,
                borderColor: glassBorder,
              },
            ]}
          />

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {title ? (
                  <Text
                    style={[styles.title, { color: colors.foreground }]}
                  >
                    {title}
                  </Text>
                ) : (
                  <View />
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeButton, { backgroundColor: closeButtonBg }]}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color={colors.foreground} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Handle for bottom sheet variant */}
            {isBottom && (
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' },
                  ]}
                />
              </View>
            )}

            {/* Children content */}
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    justifyContent: 'flex-end',
  },
  glassContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
