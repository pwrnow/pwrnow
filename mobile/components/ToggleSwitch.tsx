import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: 'small' | 'medium' | 'large';
}

export default function ToggleSwitch({
  value,
  onValueChange,
  size = 'medium',
}: ToggleSwitchProps) {
  const translateX = useSharedValue(value ? 1 : 0);

  const sizeConfig = {
    small: { width: 40, height: 22, thumbSize: 18 },
    medium: { width: 50, height: 28, thumbSize: 24 },
    large: { width: 60, height: 34, thumbSize: 30 },
  };

  const config = sizeConfig[size];

  React.useEffect(() => {
    translateX.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [value, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      translateX.value,
      [0, 1],
      ['#E5E7EB', '#3B82F6']
    );

    return {
      backgroundColor,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const translateXValue =
      translateX.value * (config.width - config.thumbSize - 2);

    return {
      transform: [{ translateX: translateXValue }],
    };
  });

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(!value);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        style={[
          {
            width: config.width,
            height: config.height,
            borderRadius: config.height / 2,
            padding: 1,
          },
          animatedStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: config.thumbSize,
              height: config.thumbSize,
              borderRadius: config.thumbSize / 2,
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
