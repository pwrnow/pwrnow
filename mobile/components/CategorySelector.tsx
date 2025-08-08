import { useRef } from 'react';
import { Text, TouchableOpacity, ScrollView } from 'react-native';
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

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={true}
      decelerationRate='fast'
    >
      {allCategories.map((category) => {
        const isActive = selectedCategory === category.slug;
        return (
          <TouchableOpacity
            key={category.slug}
            onPress={() => handlePress(category.slug)}
            activeOpacity={0.7}
          >
            <Text>{category.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
