import { Text, TouchableOpacity, ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Category } from '../types';
import { useAnalytics } from '../lib/analytics';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';

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

  // Removed auto-scroll visibility logic for category pills

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
        return (
          <View key={category.slug}>
            <TouchableOpacity
              onPress={() => handlePress(category.slug)}
              activeOpacity={0.8}
              style={{
                backgroundColor: isActive
                  ? colors.primary + '15' // Primary color with 15% opacity for active
                  : colors.muted, // Same as event card meta badges
                borderColor: isActive
                  ? colors.primary // Primary color for active
                  : colors.border, // Same as event card meta badges
              }}
              className='mr-2 rounded-full border px-3 py-2'
            >
              <Text
                style={{
                  color: isActive
                    ? colors.primary // Primary color for active (like accent elements)
                    : colors.foreground, // Same as event card meta badges
                }}
                className={`${
                  isActive ? 'font-semibold' : ''
                } text-sm tracking-[0.2px]`}
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
