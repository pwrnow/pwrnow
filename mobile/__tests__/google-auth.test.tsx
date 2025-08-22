/**
 * Tests for mobile app Google authentication components.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { jest } from '@jest/globals';

import { GoogleSignInButton, useGoogleAuth } from '../components/GoogleSignInButton';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { MobileAuthService } from '../lib/mobile-auth';

// Mock the Mobile Auth Service
jest.mock('../lib/mobile-auth');

// Mock react-native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

// Mock Google Sign-In config
jest.mock('../lib/google-signin-config', () => ({
  checkGooglePlayServices: jest.fn().mockResolvedValue(true),
}));

describe('MobileAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('should sign in successfully with valid Google response', async () => {
      const mockGoogleUser = {
        idToken: 'valid_google_token',
        user: {
          id: 'google_123',
          email: 'test@example.com',
          name: 'John Doe',
        },
      };

      const mockAuthResponse = {
        user: {
          id: '123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          auth_provider: 'google',
          is_google_verified: true,
        },
        tokens: {
          access: 'access_token',
          refresh: 'refresh_token',
        },
      };

      // Mock Google Sign-In SDK
      const mockGoogleSignin = {
        hasPlayServices: jest.fn().mockResolvedValue(true),
        signIn: jest.fn().mockResolvedValue(mockGoogleUser),
      };
      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: mockGoogleSignin,
      }));

      // Mock backend API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAuthResponse,
      });

      const result = await MobileAuthService.signInWithGoogle();

      expect(mockGoogleSignin.signIn).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/google/'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_token: 'valid_google_token',
            platform: 'mobile',
          }),
        })
      );
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle Google Sign-In cancellation', async () => {
      const mockGoogleSignin = {
        hasPlayServices: jest.fn().mockResolvedValue(true),
        signIn: jest.fn().mockRejectedValue({ code: 'SIGN_IN_CANCELLED' }),
      };
      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: mockGoogleSignin,
      }));

      await expect(MobileAuthService.signInWithGoogle()).rejects.toThrow(
        'Sign-in was cancelled by user'
      );
    });

    it('should handle missing ID token', async () => {
      const mockGoogleUser = {
        idToken: null,
        user: { email: 'test@example.com' },
      };

      const mockGoogleSignin = {
        hasPlayServices: jest.fn().mockResolvedValue(true),
        signIn: jest.fn().mockResolvedValue(mockGoogleUser),
      };
      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: mockGoogleSignin,
      }));

      await expect(MobileAuthService.signInWithGoogle()).rejects.toThrow(
        'Failed to get Google ID token'
      );
    });
  });

  describe('token management', () => {
    it('should store and retrieve tokens securely', async () => {
      const mockTokens = { access: 'access_token', refresh: 'refresh_token' };
      const mockUser = { id: '123', email: 'test@example.com' };

      // Mock SecureStore
      const mockSecureStore = {
        setItemAsync: jest.fn(),
        getItemAsync: jest.fn(),
        deleteItemAsync: jest.fn(),
        isAvailableAsync: jest.fn().mockReturnValue(true),
      };
      jest.doMock('expo-secure-store', () => mockSecureStore);

      await MobileAuthService.storeTokens(mockTokens);
      await MobileAuthService.storeUser(mockUser);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_access_token',
        'access_token'
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_refresh_token',
        'refresh_token'
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_user_data',
        JSON.stringify(mockUser)
      );
    });

    it('should check authentication status correctly', async () => {
      const mockSecureStore = {
        getItemAsync: jest.fn().mockImplementation((key) => {
          if (key === 'auth_access_token') return 'access_token';
          if (key === 'auth_user_data') return JSON.stringify({ id: '123' });
          return null;
        }),
        isAvailableAsync: jest.fn().mockReturnValue(true),
      };
      jest.doMock('expo-secure-store', () => mockSecureStore);

      const isAuthenticated = await MobileAuthService.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    it('should clear auth data on sign out', async () => {
      const mockGoogleSignin = {
        signOut: jest.fn().mockResolvedValue(undefined),
      };
      jest.doMock('@react-native-google-signin/google-signin', () => ({
        GoogleSignin: mockGoogleSignin,
      }));

      const mockSecureStore = {
        deleteItemAsync: jest.fn(),
        isAvailableAsync: jest.fn().mockReturnValue(true),
      };
      jest.doMock('expo-secure-store', () => mockSecureStore);

      await MobileAuthService.signOut();

      expect(mockGoogleSignin.signOut).toHaveBeenCalled();
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_access_token');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_user_data');
    });
  });

  describe('token refresh', () => {
    it('should refresh tokens successfully', async () => {
      const newTokens = { access: 'new_access', refresh: 'new_refresh' };

      const mockSecureStore = {
        getItemAsync: jest.fn().mockReturnValue('refresh_token'),
        setItemAsync: jest.fn(),
        isAvailableAsync: jest.fn().mockReturnValue(true),
      };
      jest.doMock('expo-secure-store', () => mockSecureStore);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => newTokens,
      });

      const result = await MobileAuthService.refreshTokens();

      expect(result).toEqual(newTokens);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/refresh/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh: 'refresh_token' }),
        })
      );
    });

    it('should clear data when refresh fails', async () => {
      const mockSecureStore = {
        getItemAsync: jest.fn().mockReturnValue('invalid_refresh_token'),
        deleteItemAsync: jest.fn(),
        isAvailableAsync: jest.fn().mockReturnValue(true),
      };
      jest.doMock('expo-secure-store', () => mockSecureStore);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid refresh token' }),
      });

      await expect(MobileAuthService.refreshTokens()).rejects.toThrow();
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });
});

describe('GoogleSignInButton', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render sign-in button', () => {
    const { getByText } = render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(getByText('Sign in with Google')).toBeTruthy();
  });

  it('should show loading state when signing in', () => {
    const { getByText } = render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
        loading={true}
      />
    );

    expect(getByText('Signing in...')).toBeTruthy();
  });

  it('should be disabled when Google Services unavailable', async () => {
    const mockCheckGooglePlayServices = jest.fn().mockResolvedValue(false);
    jest.doMock('../lib/google-signin-config', () => ({
      checkGooglePlayServices: mockCheckGooglePlayServices,
    }));

    const { getByText } = render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(getByText('Google Services Unavailable')).toBeTruthy();
    });
  });

  it('should handle successful sign-in', async () => {
    const mockAuthResponse = {
      user: { id: '123', email: 'test@example.com' },
      tokens: { access: 'token', refresh: 'refresh' },
    };

    const mockSignInWithGoogle = jest.spyOn(MobileAuthService, 'signInWithGoogle')
      .mockResolvedValue(mockAuthResponse);

    const { getByText } = render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const button = getByText('Sign in with Google');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockAuthResponse);
    });
  });

  it('should handle sign-in error', async () => {
    const error = new Error('Sign-in failed');
    const mockSignInWithGoogle = jest.spyOn(MobileAuthService, 'signInWithGoogle')
      .mockRejectedValue(error);

    const { getByText } = render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const button = getByText('Sign in with Google');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign-In Failed',
        'Sign-in failed',
        [{ text: 'OK' }]
      );
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
  });

  it('should not show alert for user cancellation', async () => {
    const error = new Error('Sign-in was cancelled by user');
    const mockSignInWithGoogle = jest.spyOn(MobileAuthService, 'signInWithGoogle')
      .mockRejectedValue(error);

    const { getByText } = render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const button = getByText('Sign in with Google');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
  });
});

describe('useGoogleAuth hook', () => {
  const TestComponent = () => {
    const { isAuthenticated, user, login, logout, isLoading } = useGoogleAuth();

    if (isLoading) {
      return <text testID="loading">Loading...</text>;
    }

    return (
      <view>
        <text testID="auth-status">
          {isAuthenticated ? 'authenticated' : 'not-authenticated'}
        </text>
        {user && <text testID="user-email">{user.email}</text>}
        <button
          testID="login-button"
          onPress={() => login({
            user: {
              id: '123',
              email: 'test@example.com',
              first_name: 'John',
              last_name: 'Doe',
              auth_provider: 'google',
              is_google_verified: true,
            },
            tokens: { access: 'token', refresh: 'refresh' }
          })}
        >
          Login
        </button>
        <button testID="logout-button" onPress={logout}>
          Logout
        </button>
      </view>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const mockInitialize = jest.spyOn(MobileAuthService, 'initialize')
      .mockImplementation(() => new Promise(() => {})); // Never resolves

    const { getByTestId } = render(<TestComponent />);

    expect(getByTestId('loading')).toBeTruthy();
  });

  it('should handle login correctly', async () => {
    const mockInitialize = jest.spyOn(MobileAuthService, 'initialize')
      .mockResolvedValue();
    const mockIsAuthenticated = jest.spyOn(MobileAuthService, 'isAuthenticated')
      .mockResolvedValue(false);

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('should handle logout correctly', async () => {
    const mockInitialize = jest.spyOn(MobileAuthService, 'initialize')
      .mockResolvedValue();
    const mockIsAuthenticated = jest.spyOn(MobileAuthService, 'isAuthenticated')
      .mockResolvedValue(false);
    const mockSignOut = jest.spyOn(MobileAuthService, 'signOut')
      .mockResolvedValue();

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    // Login first
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Then logout
    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });
});

describe('AuthProvider', () => {
  const TestComponent = () => {
    const { isAuthenticated, user, login, logout, isLoading } = useAuth();

    if (isLoading) {
      return <text testID="loading">Loading...</text>;
    }

    return (
      <view>
        <text testID="auth-status">
          {isAuthenticated ? 'authenticated' : 'not-authenticated'}
        </text>
        {user && <text testID="user-email">{user.email}</text>}
        <button
          testID="login-button"
          onPress={() => login({
            user: {
              id: '123',
              email: 'test@example.com',
              first_name: 'John',
              last_name: 'Doe',
              auth_provider: 'google',
              is_google_verified: true,
            },
            tokens: { access: 'token', refresh: 'refresh' }
          })}
        >
          Login
        </button>
        <button testID="logout-button" onPress={logout}>
          Logout
        </button>
      </view>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide authentication context', async () => {
    const mockInitialize = jest.spyOn(MobileAuthService, 'initialize')
      .mockResolvedValue();
    const mockIsAuthenticated = jest.spyOn(MobileAuthService, 'isAuthenticated')
      .mockResolvedValue(false);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  it('should restore authentication state', async () => {
    const mockUser = {
      id: '123',
      email: 'stored@example.com',
      auth_provider: 'google',
    };

    const mockInitialize = jest.spyOn(MobileAuthService, 'initialize')
      .mockResolvedValue();
    const mockIsAuthenticated = jest.spyOn(MobileAuthService, 'isAuthenticated')
      .mockResolvedValue(true);
    const mockGetUser = jest.spyOn(MobileAuthService, 'getUser')
      .mockResolvedValue(mockUser);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
      expect(mockIsAuthenticated).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalled();
      expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(getByTestId('user-email')).toHaveTextContent('stored@example.com');
    });
  });

  it('should handle login flow', async () => {
    const mockInitialize = jest.spyOn(MobileAuthService, 'initialize')
      .mockResolvedValue();
    const mockIsAuthenticated = jest.spyOn(MobileAuthService, 'isAuthenticated')
      .mockResolvedValue(false);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful API responses
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/auth/google/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: {
              id: '123',
              email: 'test@example.com',
              first_name: 'John',
              last_name: 'Doe',
              auth_provider: 'google',
              is_google_verified: true,
            },
            tokens: {
              access: 'access_token',
              refresh: 'refresh_token',
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it('should complete full authentication flow', async () => {
    const FullFlowComponent = () => {
      const { isAuthenticated, user, login, isLoading } = useAuth();

      const handleGoogleSuccess = async (response) => {
        await login(response);
      };

      if (isLoading) {
        return <text testID="loading">Loading...</text>;
      }

      return (
        <view>
          <text testID="auth-status">
            {isAuthenticated ? 'authenticated' : 'not-authenticated'}
          </text>
          {user && <text testID="user-email">{user.email}</text>}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={() => {}}
          />
        </view>
      );
    };

    const mockInitialize = jest.spyOn(MobileAuthService, 'initialize')
      .mockResolvedValue();
    const mockIsAuthenticated = jest.spyOn(MobileAuthService, 'isAuthenticated')
      .mockResolvedValue(false);
    const mockSignInWithGoogle = jest.spyOn(MobileAuthService, 'signInWithGoogle')
      .mockResolvedValue({
        user: {
          id: '123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          auth_provider: 'google',
          is_google_verified: true,
        },
        tokens: {
          access: 'access_token',
          refresh: 'refresh_token',
        },
      });

    const { getByTestId, getByText } = render(
      <AuthProvider>
        <FullFlowComponent />
      </AuthProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    // Trigger Google sign-in
    const signInButton = getByText('Sign in with Google');
    fireEvent.press(signInButton);

    // Verify authentication success
    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });
});