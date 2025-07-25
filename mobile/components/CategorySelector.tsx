import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { Category } from '../types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categorySlug: string) => void;
}

type Layout = { x: number; width: number };

export default function CategorySelector({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategorySelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scrollRef = useRef<ScrollView>(null);
  const layouts = useRef<Record<string, Layout>>({});
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Animation values
  const highlightX = useSharedValue(0);
  const highlightWidth = useSharedValue(0);

  // Ensure 'Wszystkie' is first
  const allCategories =
    categories[0]?.slug === 'wszystkie'
      ? categories
      : [{ name: 'Wszystkie', slug: 'wszystkie' }, ...categories];

  // Update highlight position when selection changes
  useEffect(() => {
    const layout = layouts.current[selectedCategory];
    if (layout && isLayoutReady) {
      // Use spring animation for bouncy effect
      highlightX.value = withSpring(layout.x, {
        damping: 15,
        stiffness: 200,
        mass: 1,
      });
      highlightWidth.value = withSpring(layout.width, {
        damping: 15,
        stiffness: 200,
        mass: 1,
      });

      // Scroll to center the selected item
      const screenWidth = Dimensions.get('window').width;
      const scrollX = layout.x - screenWidth / 2 + layout.width / 2;
      scrollRef.current?.scrollTo({ x: scrollX, animated: true });
    }
  }, [selectedCategory, isLayoutReady]);

  // Animated highlight style
  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightX.value }],
    width: highlightWidth.value,
    opacity: highlightWidth.value > 0 ? 1 : 0,
  }));

  const handlePress = async (slug: string) => {
    if (slug !== selectedCategory) {
      // Very subtle haptic feedback - just a gentle tap
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCategoryChange(slug);
    }
  };

  const handlePressIn = async () => {
    // Extremely subtle feedback on press - barely noticeable
    await Haptics.selectionAsync();
  };

  const onLayout = (slug: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    layouts.current[slug] = { x, width };

    // Check if all layouts are measured
    if (
      Object.keys(layouts.current).length === allCategories.length &&
      !isLayoutReady
    ) {
      setIsLayoutReady(true);
    }
  };

  // Animated text component
  const AnimatedText = ({ category }: { category: Category }) => {
    const isActive = selectedCategory === category.slug;
    const textProgress = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
      // Use spring for text animation too
      textProgress.value = withSpring(isActive ? 1 : 0, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
    }, [isActive]);

    const textStyle = useAnimatedStyle(() => {
      const color = interpolateColor(
        textProgress.value,
        [0, 1],
        [colors.text, '#FFFFFF']
      );
      return { color };
    });

    return (
      <Animated.Text
        style={[
          {
            fontSize: 14,
            fontWeight: isActive ? '600' : '500',
            fontFamily: isActive
              ? 'SpaceGrotesk-SemiBold'
              : 'SpaceGrotesk-Medium',
            textAlign: 'center',
            zIndex: 10,
          },
          textStyle,
        ]}
      >
        {category.name}
      </Animated.Text>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
      >
        <View style={styles.buttonsContainer}>
          {/* Animated highlight background */}
          <Animated.View
            style={[
              styles.highlight,
              { backgroundColor: colors.primary },
              highlightStyle,
            ]}
          />

          {/* Category buttons */}
          {allCategories.map((category) => {
            const isActive = selectedCategory === category.slug;
            return (
              <TouchableOpacity
                key={category.slug}
                style={[
                  styles.button,
                  !isActive && {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handlePress(category.slug)}
                onPressIn={handlePressIn}
                onLayout={(e) => onLayout(category.slug, e)}
                activeOpacity={0.9}
              >
                <AnimatedText category={category} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    position: 'relative',
    height: 34,
    alignItems: 'center',
  },
  highlight: {
    position: 'absolute',
    height: 34,
    borderRadius: 17,
    zIndex: 2,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 3,
    minWidth: 50,
  },
});
