import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../hooks/useThemeColors';

export interface SelectionOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SelectionOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export default function SelectionModal({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: SelectionModalProps) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleSelect = async (value: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20,
            maxHeight: '80%',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className='flex-row items-center justify-between mb-6'>
            <Text
              style={{ color: colors.foreground }}
              className='font-semibold text-xl'
            >
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: colors.muted }}
              className='w-8 h-8 rounded-full justify-center items-center'
            >
              <Feather name='x' size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View className='gap-2'>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={{
                  backgroundColor:
                    selectedValue === option.value
                      ? colors.primary + '10'
                      : colors.card,
                  borderColor:
                    selectedValue === option.value
                      ? colors.primary
                      : colors.border,
                }}
                className='p-4 rounded-[14px] border active:opacity-80'
              >
                <View className='flex-row items-center justify-between'>
                  <View className='flex-1'>
                    <Text
                      style={{
                        color:
                          selectedValue === option.value
                            ? colors.primary
                            : colors.foreground,
                      }}
                      className='font-semibold text-base'
                    >
                      {option.label}
                    </Text>
                    {option.description && (
                      <Text
                        style={{ color: colors.mutedForeground }}
                        className='text-sm mt-1'
                      >
                        {option.description}
                      </Text>
                    )}
                  </View>
                  {selectedValue === option.value && (
                    <Feather name='check' size={20} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
