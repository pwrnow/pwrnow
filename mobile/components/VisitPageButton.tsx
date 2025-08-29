import React from 'react';
import { TouchableOpacity, View, Text, useColorScheme } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { t } from '../lib/i18n';

interface Props {
  onPress: () => void;
  animatedStyle?: any;
}

export const VisitPageButton: React.FC<Props> = ({
  onPress,
  animatedStyle,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconPrimary = isDark ? '#FFFFFF' : '#000000';
  return (
    <View className='mx-4 mb-3'>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(32, 102, 223, 0.32)', 'rgba(236, 46, 129, 0.32)']
                : ['rgba(32, 102, 223, 0.5)', 'rgba(236, 46, 129, 0.5)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 14, padding: 1 }}
          >
            <View
              className='rounded-[13px] py-2.5 px-4 items-center justify-center border border-transparent dark:border-white/10 bg-white dark:bg-black/40'
              style={
                isDark
                  ? undefined
                  : {
                      shadowColor: '#000',
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
              }
            >
              <View className='flex-row items-center gap-2.5'>
                <Feather name='arrow-right' size={18} color={iconPrimary} />
                <Text className='text-black dark:text-white font-semibold text-base tracking-[0.5px]'>
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
