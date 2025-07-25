/**
 * PWr Now Colors - exact match from globals.css
 * Converted from HSL to hex values
 */

const tintColorLight = '#7c3aed'; // --primary: 250 80% 60%
const tintColorDark = '#7c3aed'; // Same primary for dark mode

export const Colors = {
  light: {
    text: '#14181f', // --foreground: 220 25% 9%
    background: '#f8fafc', // --background: 210 40% 98%
    tint: tintColorLight,
    icon: '#64748b', // --muted-foreground: 220 15% 40%
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorLight,
    // Exact CSS colors
    primary: '#7c3aed', // --primary: 250 80% 60%
    secondary: '#0891b2', // --secondary: 180 80% 45%
    accent: '#e11d48', // --accent: 330 80% 55%
    blue: '#3b82f6', // --blue: web date icon
    purple: '#a21caf', // --purple: web time icon
    card: '#ffffff', // --card: 0 0% 100%
    cardBorder: '#e2e8f0', // --border: 210 20% 85%
    muted: '#f1f5f9', // --muted: 210 20% 92%
    mutedForeground: '#64748b', // --muted-foreground: 220 15% 40%
    destructive: '#dc2626', // --destructive: 0 70% 50%
  },
  dark: {
    text: '#f1f5f9', // --foreground: 210 40% 98%
    background: '#14181f', // --background: 220 25% 9%
    tint: tintColorDark,
    icon: '#94a3b8', // --muted-foreground: 220 15% 70%
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    // Exact CSS colors for dark mode
    primary: '#7c3aed', // --primary: 250 80% 60%
    secondary: '#0891b2', // --secondary: 180 80% 45%
    accent: '#e11d48', // --accent: 330 80% 55%
    blue: '#3b82f6', // --blue: web date icon
    purple: '#a21caf', // --purple: web time icon
    card: '#1e293b', // --card: 220 25% 12%
    cardBorder: '#334155', // --border: 220 20% 18%
    muted: '#334155', // --muted: 220 20% 18%
    mutedForeground: '#94a3b8', // --muted-foreground: 220 15% 70%
    destructive: '#dc2626', // --destructive: 0 70% 50%
  },
};
