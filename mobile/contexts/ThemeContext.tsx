import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { settingsStorage, ThemeMode } from '../lib/settingsStorage';

export type ColorScheme = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;
  colorScheme: ColorScheme;
  setTheme: (theme: ThemeMode) => Promise<void>;
  // Color values
  colors: {
    background: string;
    foreground: string;
    muted: string;
    border: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    mutedForeground: string;
    popover: string;
    popoverForeground: string;
    // Liquid Glass design system colors
    glass: {
      background: string;
      backgroundLight: string;
      backgroundDark: string;
      border: string;
      borderLight: string;
      highlight: string;
      shadow: string;
      tint: string;
      overlay: string;
      specular: string;
    };
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(
    settingsStorage.getSettings().theme
  );
  const systemColorScheme = useColorScheme();

  // Calculate if we should use dark mode
  const isDark =
    theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');

  const colorScheme: ColorScheme = isDark ? 'dark' : 'light';

  // Define color palettes with Liquid Glass design system
  const lightColors = {
    background: '#FFFFFF',
    foreground: '#000000',
    muted: '#F1F5F9',
    border: '#E2E8F0',
    card: '#FFFFFF',
    cardForeground: '#000000',
    primary: '#2066DF',
    primaryForeground: '#FFFFFF',
    secondary: '#F1F5F9',
    secondaryForeground: '#0F172A',
    accent: '#EC2E81',
    accentForeground: '#FFFFFF',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    mutedForeground: '#64748B',
    popover: '#FFFFFF',
    popoverForeground: '#0F172A',
    // Liquid Glass colors for light mode
    glass: {
      background: 'rgba(255, 255, 255, 0.75)',
      backgroundLight: 'rgba(255, 255, 255, 0.6)',
      backgroundDark: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(0, 0, 0, 0.06)',
      borderLight: 'rgba(255, 255, 255, 0.8)',
      highlight: 'rgba(255, 255, 255, 0.95)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      tint: 'rgba(255, 255, 255, 0.7)',
      overlay: 'rgba(0, 0, 0, 0.3)',
      specular: 'rgba(255, 255, 255, 0.9)',
    },
  };

  const darkColors = {
    background: '#000000',
    foreground: '#FFFFFF',
    muted: '#111111',
    border: '#1F1F1F',
    card: '#000000',
    cardForeground: '#FFFFFF',
    primary: '#2066DF',
    primaryForeground: '#FFFFFF',
    secondary: '#111111',
    secondaryForeground: '#F8FAFC',
    accent: '#EC2E81',
    accentForeground: '#FFFFFF',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    mutedForeground: '#94A3B8',
    popover: '#000000',
    popoverForeground: '#F8FAFC',
    // Liquid Glass colors for dark mode
    glass: {
      background: 'rgba(20, 20, 20, 0.75)',
      backgroundLight: 'rgba(30, 30, 30, 0.6)',
      backgroundDark: 'rgba(10, 10, 10, 0.85)',
      border: 'rgba(255, 255, 255, 0.12)',
      borderLight: 'rgba(255, 255, 255, 0.08)',
      highlight: 'rgba(255, 255, 255, 0.15)',
      shadow: 'rgba(0, 0, 0, 0.5)',
      tint: 'rgba(255, 255, 255, 0.05)',
      overlay: 'rgba(0, 0, 0, 0.6)',
      specular: 'rgba(255, 255, 255, 0.12)',
    },
  };

  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    const unsubscribe = settingsStorage.subscribe((settings) => {
      setThemeState(settings.theme);
    });

    return unsubscribe;
  }, []);

  const setTheme = async (newTheme: ThemeMode) => {
    console.log('Setting theme to:', newTheme);
    await settingsStorage.setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colorScheme,
        setTheme,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
