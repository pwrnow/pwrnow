import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';
import ModalOverlay from './ModalOverlay';

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
  const { colors } = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <ModalOverlay style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className='w-full rounded-2xl border p-5'
        >
          <View className='items-center mb-3'>
            <View
              style={{ backgroundColor: colors.accent + '15' }}
              className='w-12 h-12 rounded-full items-center justify-center mb-2'
            >
              <Feather name='lock' size={22} color={colors.accent} />
            </View>
            <Text
              style={{ color: colors.foreground }}
              className='text-lg font-semibold text-center'
            >
              {t('signInRequiredTitle')}
            </Text>
            <Text
              style={{ color: colors.mutedForeground }}
              className='mt-1 text-center'
            >
              {t('signInRequiredMessage')}
            </Text>
          </View>
          <View className='flex-row gap-3 mt-2'>
            <TouchableOpacity
              onPress={onClose}
              style={{ borderColor: colors.border }}
              className='flex-1 py-3 rounded-xl border items-center'
              activeOpacity={0.8}
            >
              <Text
                style={{ color: colors.foreground }}
                className='font-semibold'
              >
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSignIn}
              style={{ backgroundColor: colors.primary }}
              className='flex-1 py-3 rounded-xl items-center'
              activeOpacity={0.85}
            >
              <Text
                style={{ color: colors.primaryForeground }}
                className='font-semibold'
              >
                {t('signIn')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ModalOverlay>
    </Modal>
  );
}
