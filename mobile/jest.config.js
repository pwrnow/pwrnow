module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@tanstack/.*)',
  ],
  transform: {
    '^.+\\.(js|ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
        ],
      },
    ],
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!**/jest.config.js',
    '!**/jest.polyfills.js',
    '!**/.expo/**',
    '!**/metro.config.js',
    '!**/tailwind.config.js',
    '!**/app/_layout.tsx',
    '!**/app/index.tsx',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
    '@react-native/js-polyfills/error-guard': '<rootDir>/__mocks__/emptyMock.js',
    'expo/src/async-require/messageSocket': '<rootDir>/__mocks__/emptyMock.js',
    'expo-modules-core/src/polyfill/dangerous-internal': '<rootDir>/__mocks__/emptyMock.js',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};
