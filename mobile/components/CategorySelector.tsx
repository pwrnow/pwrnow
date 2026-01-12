import { Text, TouchableOpacity, ScrollView, View, Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Category } from '../types';
import { useAnalytics } from '../lib/analytics';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';
import { useEffect, useRef } from 'react';

// Toggle to enable/disable the animated highlight for rekrutacja category
const ENABLE_REKRUTACJA_HIGHLIGHT = false;

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categorySlug: string) => void;
}

export default function CategorySelector({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategorySelectorProps) {
  const { colors, isDark } = useThemeColors();
  const analytics = useAnalytics();

  // Ensure 'Wszystkie' is first
  const allCategories =
    categories[0]?.slug === 'wszystkie'
      ? categories
      : [{ name: t('all'), slug: 'wszystkie' }, ...categories];

  const handlePress = async (slug: string) => {
    if (slug !== selectedCategory) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCategoryChange(slug);
      const cat = allCategories.find((c) => c.slug === slug);
      if (cat) {
        analytics.trackCategorySelected(cat.slug, cat.name, 'home');
      }
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces
      decelerationRate='fast'
      contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10 }}
    >
      {allCategories.map((category) => {
        const isActive = selectedCategory === category.slug;
        const isRekrutacjaHighlighted = ENABLE_REKRUTACJA_HIGHLIGHT && category.slug === 'rekrutacja';

        return (
          <CategoryButton
            key={category.slug}
            category={category}
            isActive={isActive}
            isHighlighted={isRekrutacjaHighlighted}
            onPress={() => handlePress(category.slug)}
            colors={colors}
          />
        );
      })}
    </ScrollView>
  );
}

// Unified category button component with glass effect
function CategoryButton({
  category,
  isActive,
  isHighlighted,
  onPress,
  colors,
}: {
  category: Category;
  isActive: boolean;
  isHighlighted: boolean;
  onPress: () => void;
  colors: any;
}) {
  const { isDark } = useThemeColors();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isHighlighted) {
      const animation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animatedValue, isHighlighted]);

  // Glass colors based on state
  const glassBg = isActive
    ? isDark
      ? 'rgba(32, 102, 223, 0.2)'
      : 'rgba(32, 102, 223, 0.15)'
    : isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)';

  const glassBorder = isActive
    ? isDark
      ? 'rgba(32, 102, 223, 0.4)'
      : 'rgba(32, 102, 223, 0.35)'
    : isDark
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.08)';

  // Highlighted animation border color
  const highlightedBorderColor = isHighlighted
    ? animatedValue.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [
          '#3b82f6', // Blue
          '#8b5cf6', // Purple
          '#ec4899', // Pink
          '#3b82f6', // Back to blue
          '#8b5cf6', // Purple
        ],
      })
    : glassBorder;

  return (
    <View style={categoryStyles.buttonWrapper}>
      <Animated.View
        style={[
          categoryStyles.buttonContainer,
          {
            borderColor: highlightedBorderColor,
            borderWidth: isHighlighted ? 2 : (isDark ? 0.5 : 1),
          },
        ]}
      >
        {/* Blur background */}
        <BlurView
          intensity={isDark ? 15 : 25}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, categoryStyles.blur]}
        />

        {/* Glass tint */}
        <View
          style={[
            StyleSheet.absoluteFill,
            categoryStyles.blur,
            { backgroundColor: glassBg },
          ]}
        />

        {/* Top highlight */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.08)', 'transparent']
              : ['rgba(255, 255, 255, 0.6)', 'transparent']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, categoryStyles.blur]}
        />

        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          style={categoryStyles.touchable}
        >
          <Text
            style={[
              categoryStyles.text,
              {
                color: isActive ? colors.primary : colors.foreground,
                fontWeight: isActive ? '600' : '500',
              },
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const categoryStyles = StyleSheet.create({
  buttonWrapper: {
    marginRight: 8,
  },
  buttonContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  touchable: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
    zIndex: 1,
  },
  text: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});