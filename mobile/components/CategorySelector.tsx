import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Category } from '../types';

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
  const scrollRef = useRef<ScrollView>(null);
  const containerWidthRef = useRef<number>(0);
  const currentOffsetXRef = useRef<number>(0);
  const itemLayoutsRef = useRef<Record<string, { x: number; width: number }>>(
    {}
  );

  // Ensure 'Wszystkie' is first
  const allCategories =
    categories[0]?.slug === 'wszystkie'
      ? categories
      : [{ name: 'Wszystkie', slug: 'wszystkie' }, ...categories];

  const handlePress = async (slug: string) => {
    if (slug !== selectedCategory) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCategoryChange(slug);
    }
  };

  // Ensure the selected category pill stays visible when selection changes
  useEffect(() => {
    const ensureVisible = () => {
      const layout = itemLayoutsRef.current[selectedCategory];
      const scrollView = scrollRef.current;
      const containerWidth = containerWidthRef.current;
      if (!layout || !scrollView || !containerWidth) return;

      const { x, width } = layout;
      const visibleStart = currentOffsetXRef.current;
      const visibleEnd = visibleStart + containerWidth;

      const itemStart = x;
      const itemEnd = x + width;

      let targetX: number | null = null;
      const sidePadding = 12; // matches contentContainerStyle paddingHorizontal

      if (itemStart < visibleStart) {
        targetX = Math.max(0, itemStart - sidePadding);
      } else if (itemEnd > visibleEnd) {
        targetX = Math.max(0, itemEnd - containerWidth + sidePadding);
      }

      if (targetX !== null) {
        scrollView.scrollTo({ x: targetX, animated: true });
      }
    };

    ensureVisible();
  }, [selectedCategory]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces
      decelerationRate='fast'
      contentContainerStyle={{ paddingHorizontal: 12 }}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width;
      }}
      onScroll={(e) => {
        currentOffsetXRef.current = e.nativeEvent.contentOffset.x;
      }}
      scrollEventThrottle={16}
    >
      {allCategories.map((category) => {
        const isActive = selectedCategory === category.slug;
        return (
          <View
            key={category.slug}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              itemLayoutsRef.current[category.slug] = { x, width };
              // If this is the selected item, ensure it is visible after layout
              if (category.slug === selectedCategory) {
                const containerWidth = containerWidthRef.current;
                const scrollView = scrollRef.current;
                if (!containerWidth || !scrollView) return;
                const visibleStart = currentOffsetXRef.current;
                const visibleEnd = visibleStart + containerWidth;
                const itemStart = x;
                const itemEnd = x + width;
                const sidePadding = 12;
                let targetX: number | null = null;
                if (itemStart < visibleStart) {
                  targetX = Math.max(0, itemStart - sidePadding);
                } else if (itemEnd > visibleEnd) {
                  targetX = Math.max(0, itemEnd - containerWidth + sidePadding);
                }
                if (targetX !== null) {
                  scrollView.scrollTo({ x: targetX, animated: true });
                }
              }
            }}
          >
            <TouchableOpacity
              onPress={() => handlePress(category.slug)}
              activeOpacity={0.8}
              className={`mr-2 rounded-full border px-3 py-2 ${
                isActive
                  ? 'border-accentBlue bg-accentBlue/15'
                  : 'border-[#1F1F1F] bg-white/5'
              }`}
            >
              <Text
                className={`${
                  isActive ? 'text-white font-semibold' : 'text-white/80'
                } tracking-[0.2px]`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}
