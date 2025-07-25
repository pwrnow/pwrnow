import React from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import Logo from './Logo';
import CategorySelector from './CategorySelector';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
  logoSize?: 'small' | 'medium' | 'large';
  categories?: any[];
  selectedCategory?: string;
  onCategoryChange?: (slug: string) => void;
  onBack?: () => void; // New prop
}

export default function Header({
  logoSize = 'medium',
  categories = [],
  selectedCategory = 'wszystkie',
  onCategoryChange,
  onBack,
}: HeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Feather name='arrow-left' size={22} color={colors.primary} />
              <Text style={styles.backText}>Wróć</Text>
            </TouchableOpacity>
          )}
          <View style={styles.logoRow} pointerEvents='none'>
            <Logo size={logoSize} />
          </View>
        </View>
        {categories.length > 0 && onCategoryChange && (
          <View style={styles.categoryRow}>
            <CategorySelector
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.card,
    },
    headerCard: {
      backgroundColor: colors.card,
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 0,
    },
    headerRow: {
      width: '100%',
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButton: {
      position: 'absolute',
      left: 8,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 4,
      gap: 4,
      zIndex: 2,
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'SpaceGrotesk-SemiBold',
    },
    logoRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    categoryRow: {
      width: '100%',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 0,
    },
  });
