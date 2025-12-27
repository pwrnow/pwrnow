// Polyfills to prevent React Native Flow syntax errors during Jest runs
jest.mock('@react-native/js-polyfills/error-guard', () => ({}));
jest.mock('expo/src/async-require/messageSocket', () => ({}));

global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

// Set __DEV__ flag
global.__DEV__ = true;
