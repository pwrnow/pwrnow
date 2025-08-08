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
        display: ['Righteous-Regular', 'SpaceGrotesk-Bold', 'System'],
        sans: ['SpaceGrotesk-Regular', 'System'],
        medium: ['SpaceGrotesk-Medium', 'System'],
        semibold: ['SpaceGrotesk-SemiBold', 'System'],
        light: ['SpaceGrotesk-Light', 'System'],
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
