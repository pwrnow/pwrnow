import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  onPress: () => void;
  animatedStyle?: any;
}

export const VisitPageButton: React.FC<Props> = ({
  onPress,
  animatedStyle,
}) => {
  const { colors } = useThemeColors();
  const iconPrimary = colors.foreground;
  return (
    <View className='mx-4 mb-3'>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={[colors.primary + '50', colors.accent + '50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 14, padding: 1 }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
              className='rounded-[13px] py-2.5 px-4 items-center justify-center border'
            >
              <View className='flex-row items-center gap-2.5'>
                <Feather name='arrow-right' size={18} color={iconPrimary} />
                <Text
                  style={{ color: colors.foreground }}
                  className='font-semibold text-base tracking-[0.5px]'
                >
                  {t('visitPage')}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default VisitPageButton;
