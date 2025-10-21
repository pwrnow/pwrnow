import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../hooks/useThemeColors';
import { t } from '../lib/i18n';

interface VerifyEventModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: () => void;
  eventTitle: string;
  publicationDate?: string;
}

export default function VerifyEventModal({
  visible,
  onClose,
  onVerify,
  eventTitle,
  publicationDate,
}: VerifyEventModalProps) {
  const { colors } = useThemeColors();

  const formatPublicationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if publication date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return t('verifyEventConfirmMessageTomorrow', { time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) });
    }
    
    // Otherwise show the full date
    return t('verifyEventConfirmMessageDate', { 
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    });
  };

  const handleVerify = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onVerify();
    onClose();
  };

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

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
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className='w-full rounded-2xl border p-5'
        >
          <View className='items-center mb-3'>
            <View
              style={{ backgroundColor: colors.accent + '15' }}
              className='w-12 h-12 rounded-full items-center justify-center mb-2'
            >
              <Feather name='shield' size={22} color={colors.accent} />
            </View>
            <Text
              style={{ color: colors.foreground }}
              className='text-lg font-semibold text-center'
            >
              {t('verifyEventConfirmTitle')}
            </Text>
            <Text
              style={{ color: colors.mutedForeground }}
              className='mt-1 text-center text-sm'
            >
              {publicationDate ? formatPublicationDate(publicationDate) : t('verifyEventConfirmMessage')}
            </Text>
            <Text
              style={{ color: colors.foreground }}
              className='mt-2 text-center font-medium'
            >
              "{eventTitle}"
            </Text>
          </View>
          <View className='flex-row gap-3 mt-2'>
            <TouchableOpacity
              onPress={handleCancel}
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
              onPress={handleVerify}
              className='flex-1'
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 14, padding: 1 }}
              >
                <View
                  style={{
                    backgroundColor: '#10B981',
                    shadowColor: '#10B981',
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                  }}
                  className='rounded-[13px] py-2.5 px-4 items-center justify-center'
                >
                  <Text
                    style={{ color: 'white' }}
                    className='font-semibold text-base tracking-[0.5px]'
                  >
                    {t('verify')}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
