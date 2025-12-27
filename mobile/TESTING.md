# Testing Documentation for PWRNow Mobile App

## Overview

The mobile app uses Jest and React Native Testing Library for testing. This document outlines how to run tests and write new ones.

## Test Setup

### Dependencies

- **jest**: JavaScript testing framework
- **jest-expo**: Jest preset for Expo projects
- **@testing-library/react-native**: Testing utilities for React Native
- **react-test-renderer**: Required for React Native component testing

### Configuration Files

- `jest.config.js`: Main Jest configuration
- `jest.setup.js`: Test environment setup and mocks
- `jest.polyfills.js`: Polyfills for compatibility with React Native 0.79
- `__mocks__/`: Directory containing mock implementations

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test File Locations

Tests should be placed in `__tests__` directories next to the code they test:

- `lib/__tests__/`: Tests for utility functions
- `hooks/__tests__/`: Tests for custom React hooks
- `components/__tests__/`: Tests for React components

## Writing Tests

### Utility Function Tests

Place test files in `lib/__tests__/` for utility functions. Example:

```typescript
// lib/__tests__/myUtil.test.ts
import { myFunction } from '../myUtil';

describe('myFunction', () => {
  it('should return expected value', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

### Example: Testing Date/Time Formatters

```typescript
import { formatDateRangeShort } from '../format';

describe('formatDateRangeShort', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('formats same day events correctly', () => {
    const result = formatDateRangeShort(
      '2024-06-15T10:00:00Z',
      '2024-06-15T18:00:00Z'
    );
    expect(result).toContain('15');
    expect(result).toContain('Jun');
  });
});
```

## Known Limitations

### React Native 0.79 Compatibility

Due to Flow syntax issues in React Native 0.79, component and hook tests that import from `@testing-library/react-native` are currently not supported. Focus on testing:

1. **Utility functions** (fully supported)
2. **Business logic** (fully supported)
3. **Data transformations** (fully supported)

Component and hook testing will be re-enabled once React Native resolves the Flow/Jest compatibility issues or when the app upgrades to a newer version.

## Test Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`. The following files and directories are excluded from coverage:

- Build configuration files
- Test files themselves
- Generated files in `.expo/`
- Entry point files

## Mocking

### Common Mocks

The test setup includes mocks for:

- Expo modules (constants, router, secure-store, etc.)
- React Native Async Storage
- React Native Reanimated
- React Native Gesture Handler
- TanStack React Query

### Adding New Mocks

To add new mocks, update `jest.setup.js`:

```javascript
jest.mock('module-name', () => ({
  // mock implementation
}));
```

## Best Practices

1. **Test file naming**: Use `.test.ts` or `.test.tsx` suffix
2. **Describe blocks**: Group related tests using `describe`
3. **Mock external dependencies**: Keep tests isolated
4. **Use fake timers**: For date/time dependent code
5. **Clear and descriptive test names**: Explain what is being tested

## Troubleshooting

### Tests not running

- Ensure all dependencies are installed: `pnpm install`
- Clear Jest cache: `npm test -- --clearCache`

### Module not found errors

- Check if the module needs to be mocked in `jest.setup.js`
- Verify the module is in `transformIgnorePatterns` if it's from `node_modules`

## Future Improvements

- Re-enable component testing when React Native Flow issues are resolved
- Add integration tests for critical user flows
- Set up continuous integration to run tests on pull requests
- Improve test coverage for business logic functions
