import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        bounces={true}
        decelerationRate='fast'
      >
        {allCategories.map((category) => {
          const isActive = selectedCategory === category.slug;
          return (
            <TouchableOpacity
              key={category.slug}
              style={[
                styles.button,
                isActive ? styles.activeButton : styles.inactiveButton,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={() => handlePress(category.slug)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: isActive ? '#FFFFFF' : colors.text,
                    fontFamily: isActive
                      ? 'SpaceGrotesk-SemiBold'
                      : 'SpaceGrotesk-Medium',
                    fontWeight: isActive ? '600' : '500',
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    paddingHorizontal: 0,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inactiveButton: {
    elevation: 0,
  },
  buttonText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
