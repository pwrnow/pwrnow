import React from 'react';
import { View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import Logo from './Logo';
import CategorySelector from './CategorySelector';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
  logoSize?: 'small' | 'medium' | 'large';
  categories?: any[];
  selectedCategory?: string;
  onCategoryChange?: (slug: string) => void;
  onBack?: () => void;
}

export default function Header({
  logoSize = 'medium',
  categories = [],
  selectedCategory = 'wszystkie',
  onCategoryChange,
  onBack,
}: HeaderProps) {
  return (
    <SafeAreaView>
      {onBack && (
        <TouchableOpacity onPress={onBack}>
          <Feather name='arrow-left' size={22} />
          <Text>Wróć</Text>
        </TouchableOpacity>
      )}

      <Logo size={logoSize} />

      {categories.length > 0 && onCategoryChange && (
        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      )}
    </SafeAreaView>
  );
}
