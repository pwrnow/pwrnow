/**
 * Tests for web frontend Google authentication components.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { GoogleSignInButton, useGoogleAuth } from '../components/google-signin-button';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { GoogleAuthService } from '../lib/google-auth';

// Mock the Google Auth Service
jest.mock('../lib/google-auth');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id';

describe('GoogleAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
  });

  describe('authenticateWithGoogle', () => {
    it('should authenticate successfully with valid token', async () => {
      const mockResponse = {
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

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await GoogleAuthService.authenticateWithGoogle('valid_token');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/google/'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id_token: 'valid_token',
            platform: 'web',
          }),
        })
      );
    });

    it('should throw error for invalid token', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid token' }),
      });

      await expect(
        GoogleAuthService.authenticateWithGoogle('invalid_token')
      ).rejects.toThrow('Invalid token');
    });
  });

  describe('token management', () => {
    it('should store and retrieve tokens correctly', () => {
      const tokens = { access: 'access_token', refresh: 'refresh_token' };
      const user = { id: '123', email: 'test@example.com' };

      GoogleAuthService.storeAuthData(tokens, user);

      expect(localStorage.setItem).toHaveBeenCalledWith('auth_access_token', 'access_token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_refresh_token', 'refresh_token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user));
    });

    it('should check authentication status correctly', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_access_token') return 'access_token';
        if (key === 'auth_user') return JSON.stringify({ id: '123' });
        return null;
      });

      const isAuthenticated = GoogleAuthService.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    it('should clear auth data on logout', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Logged out' }),
      });

      await GoogleAuthService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_refresh_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('token refresh', () => {
    it('should refresh tokens successfully', async () => {
      const newTokens = { access: 'new_access', refresh: 'new_refresh' };
      
      localStorage.getItem.mockReturnValue('refresh_token');
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => newTokens,
      });

      const result = await GoogleAuthService.refreshTokens();

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
      localStorage.getItem.mockReturnValue('invalid_refresh_token');
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid refresh token' }),
      });

      await expect(GoogleAuthService.refreshTokens()).rejects.toThrow();
      expect(localStorage.removeItem).toHaveBeenCalled();
    });
  });
});

describe('GoogleSignInButton', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Google Identity Services
    window.google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          prompt: jest.fn(),
          renderButton: jest.fn(),
          disableAutoSelect: jest.fn(),
        },
      },
    };
  });

  it('should render loading state initially', () => {
    render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render sign-in button when Google is loaded', async () => {
    const mockInitializeGoogle = jest.spyOn(GoogleAuthService, 'initializeGoogleAuth')
      .mockResolvedValue();

    render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockInitializeGoogle).toHaveBeenCalled();
    });
  });

  it('should handle custom children', () => {
    render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      >
        <span>Custom Sign In</span>
      </GoogleSignInButton>
    );

    expect(screen.getByText('Custom Sign In')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(
      <GoogleSignInButton
        onSuccess={mockOnSuccess}
        onError={mockOnError}
        disabled={true}
      >
        <button>Sign In</button>
      </GoogleSignInButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});

describe('useGoogleAuth hook', () => {
  const TestComponent = () => {
    const { isAuthenticated, user, login, logout } = useGoogleAuth();
    
    return (
      <div>
        <div data-testid="auth-status">
          {isAuthenticated ? 'authenticated' : 'not-authenticated'}
        </div>
        {user && <div data-testid="user-email">{user.email}</div>}
        <button onClick={() => login({ user: mockUser, tokens: mockTokens })}>
          Login
        </button>
        <button onClick={logout}>Logout</button>
      </div>
    );
  };

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    auth_provider: 'google',
    is_google_verified: true,
  };

  const mockTokens = {
    access: 'access_token',
    refresh: 'refresh_token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize as not authenticated', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });

  it('should handle login correctly', async () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('should handle logout correctly', async () => {
    const mockSignOut = jest.spyOn(GoogleAuthService, 'logout')
      .mockResolvedValue();

    render(<TestComponent />);
    
    // Login first
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });
    
    // Then logout
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });
});

describe('AuthProvider', () => {
  const TestComponent = () => {
    const { isAuthenticated, user, login, logout, isLoading } = useAuth();
    
    if (isLoading) return <div>Loading...</div>;
    
    return (
      <div>
        <div data-testid="auth-status">
          {isAuthenticated ? 'authenticated' : 'not-authenticated'}
        </div>
        {user && <div data-testid="user-email">{user.email}</div>}
        <button 
          onClick={() => login({ 
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
        <button onClick={logout}>Logout</button>
      </div>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide authentication context', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  it('should handle login flow', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('should restore authentication state from storage', async () => {
    // Setup existing auth state in localStorage
    localStorage.setItem('auth_access_token', 'stored_token');
    localStorage.setItem('auth_user', JSON.stringify({
      id: '123',
      email: 'stored@example.com',
      auth_provider: 'google',
    }));

    const mockIsAuthenticated = jest.spyOn(GoogleAuthService, 'isAuthenticated')
      .mockReturnValue(true);
    const mockGetUser = jest.spyOn(GoogleAuthService, 'getUser')
      .mockReturnValue({
        id: '123',
        email: 'stored@example.com',
        auth_provider: 'google',
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockIsAuthenticated).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalled();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com');
    });
  });

  it('should throw error when used outside provider', () => {
    const ConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    ConsoleError.mockRestore();
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
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
      
      if (url.includes('/auth/user/profile/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: '123',
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            auth_provider: 'google',
            is_google_verified: true,
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
      const { isAuthenticated, user, login } = useAuth();
      
      const handleGoogleSuccess = async () => {
        const response = await GoogleAuthService.authenticateWithGoogle('test_token');
        await login(response);
      };
      
      return (
        <div>
          <div data-testid="auth-status">
            {isAuthenticated ? 'authenticated' : 'not-authenticated'}
          </div>
          {user && <div data-testid="user-email">{user.email}</div>}
          <button onClick={handleGoogleSuccess}>Google Sign In</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <FullFlowComponent />
      </AuthProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    // Trigger Google sign-in
    fireEvent.click(screen.getByText('Google Sign In'));

    // Verify authentication success
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    // Verify API calls were made
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/google/'),
      expect.any(Object)
    );
  });
});