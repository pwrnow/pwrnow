import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook that provides easy access to theme colors and utilities
 * This is the single source of truth for all theming in the app
 */
export function useThemeColors() {
  const { colors, isDark, colorScheme, theme } = useTheme();

  return {
    // Color values
    colors,

    // Theme state
    isDark,
    colorScheme,
    theme,

    // Common color combinations
    text: {
      primary: colors.foreground,
      secondary: colors.mutedForeground,
      accent: colors.accent,
      destructive: colors.destructive,
    },

    background: {
      primary: colors.background,
      secondary: colors.muted,
      card: colors.card,
      popover: colors.popover,
    },

    border: {
      primary: colors.border,
      accent: colors.accent,
      destructive: colors.destructive,
    },

    // Utility functions
    getTextColor: (
      variant: 'primary' | 'secondary' | 'accent' | 'destructive' = 'primary'
    ) => {
      switch (variant) {
        case 'secondary':
          return colors.mutedForeground;
        case 'accent':
          return colors.accent;
        case 'destructive':
          return colors.destructive;
        default:
          return colors.foreground;
      }
    },

    getBackgroundColor: (
      variant: 'primary' | 'secondary' | 'card' | 'popover' = 'primary'
    ) => {
      switch (variant) {
        case 'secondary':
          return colors.muted;
        case 'card':
          return colors.card;
        case 'popover':
          return colors.popover;
        default:
          return colors.background;
      }
    },

    getBorderColor: (
      variant: 'primary' | 'accent' | 'destructive' = 'primary'
    ) => {
      switch (variant) {
        case 'accent':
          return colors.accent;
        case 'destructive':
          return colors.destructive;
        default:
          return colors.border;
      }
    },
  };
}
