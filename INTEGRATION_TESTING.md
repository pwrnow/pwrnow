# Integration Testing Guide for Google OAuth Authentication

This document provides comprehensive testing procedures for the Google OAuth authentication flow across all platforms (backend, web, mobile).

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Environment Setup](#environment-setup)
3. [Backend Testing](#backend-testing)
4. [Web Frontend Testing](#web-frontend-testing)
5. [Mobile App Testing](#mobile-app-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Manual Testing Checklist](#manual-testing-checklist)
8. [Automated Testing Scripts](#automated-testing-scripts)
9. [Common Issues and Solutions](#common-issues-and-solutions)

## Testing Overview

### Test Levels

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: API endpoint and service testing
3. **End-to-End Tests**: Complete authentication flow testing
4. **Manual Tests**: User experience validation

### Test Environments

- **Development**: `localhost` with test Google OAuth credentials
- **Staging**: Staging environment with production-like setup
- **Production**: Live environment (limited testing)

## Environment Setup

### Prerequisites

1. Google Cloud Console project with OAuth configured
2. Test Google accounts
3. Development environment running
4. All dependencies installed

### Test Credentials

Create separate Google OAuth applications for testing:

```bash
# Development
GOOGLE_OAUTH_CLIENT_ID=dev-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=dev-client-secret

# Test Web Client
NEXT_PUBLIC_GOOGLE_CLIENT_ID=test-web-client-id.apps.googleusercontent.com

# Test Mobile Clients
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=test-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=test-android-client-id.apps.googleusercontent.com
```

## Backend Testing

### Running Backend Tests

```bash
cd backend

# Run all authentication tests
python manage.py test users.test_google_auth

# Run specific test classes
python manage.py test users.test_google_auth.GoogleOAuthServiceTests
python manage.py test users.test_google_auth.GoogleAuthAPITests
python manage.py test users.test_google_auth.IntegrationTests

# Run with coverage
coverage run --source='.' manage.py test users.test_google_auth
coverage report
coverage html
```

### API Endpoint Testing

#### 1. Google Authentication Endpoint

```bash
# Test successful authentication
curl -X POST http://localhost:8000/v1/auth/google/ \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "VALID_GOOGLE_ID_TOKEN",
    "platform": "web"
  }'

# Expected Response (200)
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "auth_provider": "google",
    "is_google_verified": true
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  }
}
```

#### 2. Token Refresh Endpoint

```bash
# Test token refresh
curl -X POST http://localhost:8000/v1/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "VALID_REFRESH_TOKEN"
  }'

# Expected Response (200)
{
  "access": "new_jwt_access_token",
  "refresh": "new_jwt_refresh_token"
}
```

#### 3. Protected Endpoints

```bash
# Test protected resource access
curl -X GET http://localhost:8000/v1/auth/user/profile/ \
  -H "Authorization: Bearer VALID_ACCESS_TOKEN"

# Expected Response (200)
{
  "id": "uuid",
  "email": "test@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "auth_provider": "google",
  "is_google_verified": true
}
```

### Database Testing

```bash
# Check user creation
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.filter(auth_provider='google').first()
>>> print(f"Google User: {user.email}, Verified: {user.is_google_verified}")
```

## Web Frontend Testing

### Running Web Tests

```bash
cd web

# Run all tests
npm test

# Run Google auth specific tests
npm test google-auth.test.tsx

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Manual Web Testing

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Authentication Flow**
   - Navigate to `/login`
   - Click "Sign in with Google"
   - Complete Google OAuth flow
   - Verify redirect to `/dashboard`
   - Check user profile data display

3. **Test Protected Routes**
   - Access `/dashboard` (should work when authenticated)
   - Access `/profile` (should work when authenticated)
   - Log out and try accessing protected routes (should redirect to login)

4. **Test Token Management**
   - Check browser localStorage for tokens
   - Wait for token expiration and verify auto-refresh
   - Test manual token refresh

### Browser Console Testing

```javascript
// Check authentication status
console.log('Is authenticated:', localStorage.getItem('auth_access_token') !== null);

// Check stored user data
console.log('User data:', JSON.parse(localStorage.getItem('auth_user') || '{}'));

// Test API call with stored token
const token = localStorage.getItem('auth_access_token');
fetch('/api/v1/auth/user/profile/', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => console.log('Profile data:', data));
```

## Mobile App Testing

### Running Mobile Tests

```bash
cd mobile

# Run all tests
npm test

# Run Google auth specific tests
npm test google-auth.test.tsx

# Run tests with coverage
npm test -- --coverage
```

### Device Testing

#### iOS Testing

1. **Setup iOS Simulator**
   ```bash
   npx expo run:ios
   ```

2. **Test Google Sign-In**
   - Tap "Sign in with Google" button
   - Complete Google OAuth flow in system browser
   - Verify return to app with authentication
   - Check secure storage for tokens

3. **Test App Backgrounding**
   - Authenticate user
   - Background the app
   - Foreground the app
   - Verify authentication state persists

#### Android Testing

1. **Setup Android Emulator**
   ```bash
   npx expo run:android
   ```

2. **Test Google Play Services**
   - Verify Google Play Services are available
   - Test Google Sign-In with Play Services
   - Test fallback behavior if services unavailable

3. **Test Device Rotation**
   - Start authentication flow
   - Rotate device during process
   - Verify flow continues correctly

### Mobile Debug Commands

```bash
# Check SecureStore contents (development)
npx expo install expo-dev-menu
# In app dev menu: "Debug" > "Async Storage"

# Test with Flipper (if configured)
# View SecureStore and networking in Flipper

# React Native Debugger
# View component state and network requests
```

## End-to-End Testing

### Automated E2E Tests

Create a comprehensive E2E test script:

```javascript
// e2e-test.js
const { chromium } = require('playwright');

async function runE2ETest() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Navigate to login page
    await page.goto('http://localhost:3000/login');
    
    // 2. Click Google Sign-In button
    await page.click('[data-testid="google-signin-button"]');
    
    // 3. Handle Google OAuth flow
    await page.waitForURL('**/accounts.google.com/**');
    await page.fill('[type="email"]', 'test@example.com');
    await page.click('#identifierNext');
    await page.fill('[type="password"]', 'testpassword');
    await page.click('#passwordNext');
    
    // 4. Verify redirect back to app
    await page.waitForURL('**/dashboard');
    
    // 5. Check authentication state
    const userEmail = await page.textContent('[data-testid="user-email"]');
    console.log('Authenticated user:', userEmail);
    
    // 6. Test protected route access
    await page.goto('http://localhost:3000/profile');
    await page.waitForSelector('[data-testid="profile-page"]');
    
    // 7. Test logout
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('**/login');
    
    console.log('✅ E2E test passed');
  } catch (error) {
    console.error('❌ E2E test failed:', error);
  } finally {
    await browser.close();
  }
}

runE2ETest();
```

### Cross-Platform Flow Testing

1. **Web → API → Database**
   - Sign in via web interface
   - Verify API calls in network tab
   - Check database for user record
   - Verify token storage in browser

2. **Mobile → API → Database**
   - Sign in via mobile app
   - Check device logs for API calls
   - Verify same user record in database
   - Check secure storage on device

3. **Session Consistency**
   - Sign in on web
   - Use same account on mobile
   - Verify user data consistency
   - Test concurrent sessions

## Manual Testing Checklist

### Authentication Flow
- [ ] Google Sign-In button renders correctly
- [ ] Google OAuth popup/redirect works
- [ ] User consent screen appears
- [ ] Successful authentication redirects properly
- [ ] User data is correctly stored
- [ ] JWT tokens are generated and stored

### User Management
- [ ] New user is created on first sign-in
- [ ] Existing user is updated on subsequent sign-ins
- [ ] Profile picture is synced from Google
- [ ] Email verification status is correct
- [ ] User can update profile information

### Security
- [ ] Tokens are stored securely
- [ ] Token refresh works automatically
- [ ] Expired tokens are handled properly
- [ ] Logout clears all stored data
- [ ] Protected routes require authentication

### Error Handling
- [ ] Invalid Google token shows error
- [ ] Network errors are handled gracefully
- [ ] User cancellation is handled properly
- [ ] Missing Google services shows appropriate message

### Cross-Platform
- [ ] Same user can sign in on web and mobile
- [ ] Profile changes sync between platforms
- [ ] Logout on one platform doesn't affect others
- [ ] Token refresh works on all platforms

## Automated Testing Scripts

### Backend Test Script

```bash
#!/bin/bash
# test-backend.sh

echo "🧪 Running Backend Tests..."

cd backend

# Run migrations
python manage.py migrate

# Run tests with coverage
coverage run --source='.' manage.py test users.test_google_auth
coverage report --fail-under=80

# Check for security issues
python manage.py check --deploy

echo "✅ Backend tests completed"
```

### Frontend Test Script

```bash
#!/bin/bash
# test-frontend.sh

echo "🧪 Running Frontend Tests..."

# Test web frontend
cd web
npm ci
npm run lint
npm test -- --coverage --watchAll=false

# Test mobile app
cd ../mobile
npm ci
npm run lint
npm test -- --coverage --watchAll=false

echo "✅ Frontend tests completed"
```

### Integration Test Script

```bash
#!/bin/bash
# test-integration.sh

echo "🧪 Running Integration Tests..."

# Start services
docker-compose up -d postgres redis

# Wait for services
sleep 10

# Run backend
cd backend
python manage.py migrate
python manage.py runserver &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Run web frontend
cd ../web
npm run build
npm start &
WEB_PID=$!

# Wait for frontend to start
sleep 10

# Run E2E tests
npm run test:e2e

# Cleanup
kill $BACKEND_PID $WEB_PID
docker-compose down

echo "✅ Integration tests completed"
```

## Common Issues and Solutions

### Issue 1: Google Token Verification Fails
**Symptoms**: 401 errors on `/auth/google/` endpoint
**Solutions**:
- Check Google OAuth client ID configuration
- Verify token audience matches client ID
- Ensure backend can reach Google's token verification service

### Issue 2: CORS Errors on Web
**Symptoms**: Browser blocks API requests
**Solutions**:
- Add frontend URL to `CORS_ALLOWED_ORIGINS`
- Set `CORS_ALLOW_CREDENTIALS = True`
- Check `CSRF_TRUSTED_ORIGINS` configuration

### Issue 3: Mobile App Can't Sign In
**Symptoms**: Google Sign-In fails on mobile
**Solutions**:
- Verify Google Play Services are available
- Check iOS/Android client ID configuration
- Ensure correct SHA-1 certificate fingerprint (Android)

### Issue 4: Token Refresh Fails
**Symptoms**: Users get logged out unexpectedly
**Solutions**:
- Check JWT secret key consistency
- Verify token expiration settings
- Ensure refresh token rotation is working

### Issue 5: Profile Picture Not Loading
**Symptoms**: User profile shows default avatar
**Solutions**:
- Check Google OAuth scopes include 'profile'
- Verify CORS allows image loading from Google
- Check network connectivity to Google services

## Performance Testing

### Load Testing Backend

```bash
# Install artillery
npm install -g artillery

# Create load test config
cat > artillery-config.yml << EOF
config:
  target: 'http://localhost:8000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Google Auth Flow"
    requests:
      - post:
          url: "/v1/auth/google/"
          json:
            id_token: "test_token"
            platform: "web"
EOF

# Run load test
artillery run artillery-config.yml
```

### Memory Leak Testing

```javascript
// Check for memory leaks in frontend
// Run in browser console after authentication flow

// Monitor memory usage
const checkMemory = () => {
  if (performance.memory) {
    console.log({
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    });
  }
};

// Run authentication flow multiple times
for (let i = 0; i < 10; i++) {
  // Simulate login/logout cycle
  setTimeout(() => {
    checkMemory();
    console.log(`Cycle ${i + 1} completed`);
  }, i * 1000);
}
```

## Monitoring and Alerts

### Setting Up Test Monitoring

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-monitor:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus-test.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=testpass
```

### Test Metrics to Monitor

- Authentication success/failure rates
- Token refresh frequency
- API response times
- Error rates by endpoint
- User session duration

---

This integration testing guide provides comprehensive coverage for validating the Google OAuth authentication implementation across all platforms. Regular execution of these tests ensures the reliability and security of the authentication system.