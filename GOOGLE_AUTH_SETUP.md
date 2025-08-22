# Google Authentication Integration Guide

This document provides comprehensive instructions for setting up and using Google OAuth authentication across the full-stack PwrNow application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Google Cloud Console Setup](#google-cloud-console-setup)
4. [Backend Configuration](#backend-configuration)
5. [Web Frontend Setup](#web-frontend-setup)
6. [Mobile App Setup](#mobile-app-setup)
7. [Environment Variables](#environment-variables)
8. [API Endpoints](#api-endpoints)
9. [Usage Examples](#usage-examples)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)
12. [Security Considerations](#security-considerations)

## Overview

The Google authentication integration provides:

- **Backend**: Django REST API with JWT tokens and Google OAuth verification
- **Web Frontend**: Next.js with Google Identity Services integration
- **Mobile App**: React Native with Google Sign-In SDK
- **Security**: Secure token storage and automatic refresh
- **User Management**: Extended User model with Google profile data

## Prerequisites

- Google Cloud Console account
- Python 3.8+ (backend)
- Node.js 18+ (frontend)
- React Native development environment (mobile)
- PostgreSQL database
- Redis instance

## Google Cloud Console Setup

### 1. Create a New Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity Services

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - Application name: `PwrNow`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`
5. Add test users if needed

### 3. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Create separate credentials for each platform:

#### Web Application
- Application type: **Web application**
- Name: `PwrNow Web`
- Authorized JavaScript origins:
  - `http://localhost:3000` (development)
  - `https://yourdomain.com` (production)
- Authorized redirect URIs:
  - `http://localhost:3000/auth/callback` (development)
  - `https://yourdomain.com/auth/callback` (production)

#### iOS Application
- Application type: **iOS**
- Name: `PwrNow iOS`
- Bundle ID: Your iOS app bundle ID (e.g., `com.company.pwrnow`)

#### Android Application
- Application type: **Android**
- Name: `PwrNow Android`
- Package name: Your Android app package name
- SHA-1 certificate fingerprint: Your app's signing certificate SHA-1

## Backend Configuration

### 1. Install Dependencies

The following dependencies are already added to `requirements.txt`:
```
google-auth==2.36.0
google-auth-oauthlib==1.2.1
djangorestframework-simplejwt==5.3.0
```

Install them:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Database Migration

```bash
python manage.py migrate
```

### 3. Configure Settings

The Django settings have been configured with JWT and Google OAuth support. Ensure your `.env` file contains:

```bash
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_LIFETIME=15  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days
```

### 4. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

## Web Frontend Setup

### 1. Install Dependencies

Dependencies are already added to `package.json`:
```json
{
  "@google-cloud/local-auth": "^3.0.1",
  "googleapis": "^140.0.1",
  "next-auth": "^5.0.0"
}
```

Install them:
```bash
cd web
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### 3. Wrap App with AuthProvider

Update your main layout to include the AuthProvider:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Mobile App Setup

### 1. Install Dependencies

Dependencies are already added to `package.json`:
```json
{
  "@react-native-google-signin/google-signin": "^13.1.0",
  "react-native-keychain": "^8.2.0",
  "expo-secure-store": "~14.0.1"
}
```

Install them:
```bash
cd mobile
npm install
```

### 2. Configure Environment Variables

Create `.env`:
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

### 3. Configure app.json for Google Sign-In

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "your-ios-client-id.apps.googleusercontent.com"
        }
      ]
    ],
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/auth/google/` | Authenticate with Google ID token |
| `POST` | `/v1/auth/refresh/` | Refresh JWT tokens |
| `GET` | `/v1/auth/user/profile/` | Get user profile |
| `PATCH` | `/v1/auth/user/profile/` | Update user profile |
| `POST` | `/v1/auth/logout/` | Logout user |
| `GET` | `/v1/auth/status/` | Check auth status |

### Google Authentication Request

```json
POST /v1/auth/google/
{
  "id_token": "google_id_token_here",
  "platform": "web" // or "mobile"
}
```

### Response

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture_url": "https://...",
    "auth_provider": "google",
    "is_google_verified": true
  },
  "tokens": {
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token"
  }
}
```

## Usage Examples

### Web Frontend

```tsx
import { GoogleSignInButton, useAuth } from '@/components/google-signin-button';

function LoginPage() {
  const { login } = useAuth();

  const handleGoogleSuccess = async (response) => {
    await login(response);
    // Redirect to dashboard
  };

  const handleGoogleError = (error) => {
    console.error('Login failed:', error);
  };

  return (
    <GoogleSignInButton
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleError}
    />
  );
}
```

### Mobile App

```tsx
import { GoogleSignInButton, useGoogleAuth } from '../components/GoogleSignInButton';

function LoginScreen() {
  const { login } = useGoogleAuth();

  const handleGoogleSuccess = async (response) => {
    await login(response);
    // Navigate to main app
  };

  return (
    <GoogleSignInButton
      onSuccess={handleGoogleSuccess}
      size="large"
    />
  );
}
```

### Protected Routes

```tsx
// Web
import { withAuth } from '@/lib/auth-context';

const ProtectedComponent = withAuth(function Dashboard() {
  return <div>Protected content</div>;
});

// Or use hook
function AnotherComponent() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return <div>Hello {user.first_name}!</div>;
}
```

## Testing

### Backend Tests

```bash
cd backend
python manage.py test users.tests
```

### Frontend Tests

```bash
cd web
npm test

cd mobile
npm test
```

### Manual Testing Checklist

- [ ] Google Sign-In works on web
- [ ] Google Sign-In works on mobile
- [ ] JWT tokens are properly stored
- [ ] Token refresh works automatically
- [ ] User profile data is correctly saved
- [ ] Logout clears all stored data
- [ ] Protected routes require authentication

## Troubleshooting

### Common Issues

1. **"Google Client ID not configured"**
   - Check environment variables are set correctly
   - Ensure the client ID matches your Google Cloud Console configuration

2. **"Invalid Google token"**
   - Verify the Google Cloud Console project has the correct APIs enabled
   - Check that the client ID in your app matches the one in Google Cloud Console

3. **"Token refresh failed"**
   - Check that JWT_SECRET_KEY is consistent across deployments
   - Verify token expiration settings

4. **Mobile: "Google Play Services not available"**
   - Ensure Google Play Services are installed on the Android device
   - For iOS, ensure the correct URL scheme is configured

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=True
LOGGING_LEVEL=DEBUG
```

### Network Issues

For local development with mobile apps, ensure:
- Backend is accessible from mobile device (use device IP, not localhost)
- CORS settings allow mobile app origins
- Firewall allows connections on backend port

## Security Considerations

### Token Security

- JWT access tokens expire after 15 minutes by default
- Refresh tokens expire after 7 days by default
- Tokens are stored securely (SecureStore on mobile, httpOnly cookies recommended for web)

### OAuth Security

- Always verify Google tokens on the backend
- Use HTTPS in production
- Validate redirect URIs in Google Cloud Console
- Implement CSRF protection for web applications

### User Privacy

- Only request necessary OAuth scopes (email, profile)
- Provide clear privacy policy
- Allow users to delete their accounts
- Respect user consent for data collection

### Production Deployment

- Use environment variables for all secrets
- Enable HTTPS/SSL
- Configure proper CORS origins
- Set up monitoring and alerting
- Regular security updates

## Additional Resources

- [Google Identity Documentation](https://developers.google.com/identity)
- [Django REST Framework JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

---

For questions or issues, please refer to the project repository or contact the development team.