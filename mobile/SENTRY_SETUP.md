# Sentry Setup Guide for PWr Now Mobile App

This guide explains how to set up and configure Sentry for error tracking and performance monitoring in the PWr Now mobile application.

## What is Sentry?

Sentry is an error tracking and performance monitoring platform that helps you track and fix crashes and errors in real-time. It provides:

- **Error Tracking**: Automatic capture of JavaScript errors and native crashes
- **Performance Monitoring**: Track app performance and identify bottlenecks
- **Release Health**: Monitor app stability across versions
- **User Context**: See which users are affected by issues

## Setup Steps

### 1. Create a Sentry Account and Project

1. Go to [sentry.io](https://sentry.io) and sign up or log in
2. Create a new project and select **React Native** as the platform
3. Copy your project's DSN (Data Source Name) - it looks like:
   ```
   https://[key]@[organization].ingest.sentry.io/[project-id]
   ```

### 2. Configure Environment Variables

Add your Sentry DSN to your environment configuration:

**For local development**, create a `.env.local` file in the `mobile/` directory:

```env
EXPO_PUBLIC_SENTRY_DSN=https://[your-key]@[your-org].ingest.sentry.io/[your-project-id]
```

**For production builds**, set the environment variable in your EAS build configuration or CI/CD pipeline.

### 3. Verify Installation

The Sentry SDK has already been installed and configured in the app with the following features:

- ✅ Automatic error tracking
- ✅ Performance monitoring
- ✅ Native crash reporting
- ✅ Release tracking
- ✅ User session tracking

### 4. Test the Integration

You can test if Sentry is working by triggering a test error in development mode:

```javascript
import * as Sentry from '@sentry/react-native';

// Trigger a test error
Sentry.captureException(new Error('Test error from PWr Now mobile app'));
```

Or trigger a crash:

```javascript
throw new Error('Test crash');
```

Check your Sentry dashboard to see if the error appears.

## Configuration Details

### Sentry Settings

The Sentry SDK is configured in `app/_layout.tsx` with the following settings:

- **Debug Mode**: Enabled in development (`__DEV__`)
- **Environment**: Automatically set to `development` or `production`
- **Tracing**: 100% sample rate in development, 20% in production
- **Native Frames Tracking**: Enabled in production for performance monitoring
- **Session Tracking**: Automatically tracks user sessions

### Plugin Configuration

The `sentry-expo` plugin is configured in `app.json` to automatically:

- Upload source maps for better error stack traces
- Track app releases
- Integrate with native iOS and Android error tracking

## What Gets Tracked?

### Automatic Tracking

Sentry automatically captures:

- JavaScript errors and unhandled promise rejections
- Native crashes (iOS and Android)
- Navigation/routing events
- Network requests (when enabled)
- User interactions leading to errors

### Manual Tracking

You can manually track events using:

```javascript
import * as Sentry from '@sentry/react-native';

// Capture a message
Sentry.captureMessage('User completed onboarding', 'info');

// Capture an exception
try {
  // some code
} catch (error) {
  Sentry.captureException(error);
}

// Add custom context
Sentry.setContext('event', {
  id: eventId,
  name: eventName,
});

// Set user information
Sentry.setUser({
  id: userId,
  email: userEmail,
});
```

## Best Practices

1. **Don't commit your DSN**: Keep your `.env.local` file gitignored
2. **Use different projects**: Create separate Sentry projects for development and production
3. **Add user context**: Set user information when they log in to better track issues
4. **Add breadcrumbs**: Add custom breadcrumbs for important app events
5. **Set release versions**: Tag errors with app version for better tracking
6. **Configure alerts**: Set up Sentry alerts for critical errors

## Troubleshooting

### Sentry not capturing errors?

1. Check that `EXPO_PUBLIC_SENTRY_DSN` is set in your environment
2. Verify the DSN is correct in the Sentry dashboard
3. Check that you're running the app in development mode if testing
4. Look for Sentry initialization logs in the console

### Source maps not working?

1. Ensure you're creating production builds with `eas build`
2. Check that the `sentry-expo` plugin is properly configured in `app.json`
3. Verify your Sentry auth token is set in EAS secrets

### Too many events?

If you're hitting Sentry rate limits:

1. Reduce the `tracesSampleRate` in production
2. Use `beforeSend` to filter out specific errors
3. Set up proper error boundaries to catch and handle errors locally

## Additional Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry Expo Documentation](https://docs.expo.dev/guides/using-sentry/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Release Health](https://docs.sentry.io/product/releases/health/)
