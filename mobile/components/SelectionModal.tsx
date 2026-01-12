import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../hooks/useThemeColors';
import GlassModal from './GlassModal';

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
  const { colors, isDark } = useThemeColors();

  const handleSelect = async (value: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(value);
    onClose();
  };

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      title={title}
      variant="bottom"
    >
      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          
          const optionBg = isSelected
            ? isDark
              ? 'rgba(32, 102, 223, 0.15)'
              : 'rgba(32, 102, 223, 0.1)'
            : isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(0, 0, 0, 0.03)';

          const optionBorder = isSelected
            ? isDark
              ? 'rgba(32, 102, 223, 0.4)'
              : 'rgba(32, 102, 223, 0.35)'
            : isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.06)';

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              {/* Blur background */}
              <BlurView
                intensity={isDark ? 20 : 30}
                tint={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 16, overflow: 'hidden' }]}
              />

              {/* Background tint */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: optionBg, borderRadius: 16 },
                ]}
              />

              {/* Highlight gradient */}
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(255, 255, 255, 0.06)', 'transparent']
                    : ['rgba(255, 255, 255, 0.5)', 'transparent']
                }
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />

              {/* Border */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 16,
                    borderWidth: isDark ? 0.5 : 1,
                    borderColor: optionBorder,
                  },
                ]}
              />

              {/* Content */}
              <View style={styles.optionContent}>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isSelected ? colors.primary : colors.foreground },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text
                      style={[styles.optionDescription, { color: colors.mutedForeground }]}
                    >
                      {option.description}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Feather name='check' size={20} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 10,
  },
  optionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
  },
});
