import { Text, TouchableOpacity, ScrollView, View, Animated } from 'react-native';
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

// Unified category button component
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

  // Create a fluid gradient animation when highlighted
  const gradientColors = isHighlighted
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
    : isActive
      ? colors.primary
      : colors.border;

  return (
    <View style={{ marginRight: 8 }}>
      <Animated.View
        style={{
          borderRadius: 20,
          borderWidth: 2,
          borderColor: gradientColors,
        }}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{
            backgroundColor: isActive
              ? colors.primary + '15'
              : colors.muted,
            borderRadius: 18,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: isActive
                ? colors.primary
                : colors.foreground,
            }}
            className={`${
              isActive ? 'font-semibold' : ''
            } text-sm tracking-[0.2px]`}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}