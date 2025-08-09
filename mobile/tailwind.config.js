/** @type {import('tailwindcss').Config} */
module.exports = {
  // Use system appearance for React Native
  darkMode: 'media',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#FFFFFF',
        muted: '#111111',
        border: '#1F1F1F',
        accentBlue: '#2066DF',
        accentPink: '#EC2E81',
      },
      fontFamily: {
        // Keep default sans for backwards compatibility (regular weight)
        sans: ['SpaceGrotesk-Regular', 'System'],
        // Display/logo font
        display: ['Righteous-Regular', 'System'],
        // Explicit family aliases to avoid conflict with Tailwind weight utilities
        grotesk: ['SpaceGrotesk-Regular', 'System'],
        groteskMedium: ['SpaceGrotesk-Medium', 'System'],
        groteskSemibold: ['SpaceGrotesk-SemiBold', 'System'],
        groteskLight: ['SpaceGrotesk-Light', 'System'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
      },
      opacity: {
        15: '0.15',
      },
    },
  },
  plugins: [],
};
