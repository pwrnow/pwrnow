import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { t } from '../lib/i18n';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View className='flex-1 bg-black/50 justify-center items-center px-6'>
        <Animated.View
          entering={FadeInDown.duration(250)}
          className='w-full rounded-2xl bg-white dark:bg-black border border-black/10 dark:border-white/10 p-5'
        >
          <View className='items-center mb-3'>
            <View className='w-12 h-12 rounded-full bg-accentPink/15 items-center justify-center mb-2'>
              <Feather name='lock' size={22} color={'#EC2E81'} />
            </View>
            <Text className='text-black dark:text-white text-lg font-semibold text-center'>
              {t('signInRequiredTitle')}
            </Text>
            <Text className='text-black/70 dark:text-white/70 mt-1 text-center'>
              {t('signInRequiredMessage')}
            </Text>
          </View>
          <View className='flex-row gap-3 mt-2'>
            <TouchableOpacity
              onPress={onClose}
              className='flex-1 py-3 rounded-xl border border-black/10 dark:border-white/10 items-center'
              activeOpacity={0.8}
            >
              <Text className='text-black dark:text-white font-semibold'>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSignIn}
              className='flex-1 py-3 rounded-xl bg-accentBlue items-center'
              activeOpacity={0.85}
            >
              <Text className='text-white font-semibold'>{t('signIn')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
