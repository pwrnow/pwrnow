import { Text, TouchableOpacity, ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Category } from '../types';
import { t } from '../lib/i18n';

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
  // Ensure 'Wszystkie' is first
  const allCategories =
    categories[0]?.slug === 'wszystkie'
      ? categories
      : [{ name: t('all'), slug: 'wszystkie' }, ...categories];

  const handlePress = async (slug: string) => {
    if (slug !== selectedCategory) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCategoryChange(slug);
    }
  };

  // Removed auto-scroll visibility logic for category pills

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces
      decelerationRate='fast'
      contentContainerStyle={{ paddingHorizontal: 10 }}
    >
      {allCategories.map((category) => {
        const isActive = selectedCategory === category.slug;
        return (
          <View key={category.slug}>
            <TouchableOpacity
              onPress={() => handlePress(category.slug)}
              activeOpacity={0.8}
              className={`mr-2 rounded-full border px-3 py-2 ${
                isActive
                  ? 'border-accentBlue bg-accentBlue/15'
                  : 'border-black/10 dark:border-[#1F1F1F] bg-black/5 dark:bg-white/5'
              }`}
            >
              <Text
                className={`${
                  isActive
                    ? 'text-black dark:text-white font-semibold'
                    : 'text-black/80 dark:text-white/80'
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
