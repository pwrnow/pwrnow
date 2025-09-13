import { Event, Category, Organization, Post } from '../types';
import { getApiUrl } from './config';
import i18n from './i18n';
import * as SecureStore from 'expo-secure-store';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './authStorage';
import { shouldAttemptNetworkRequest, isOffline } from './network';

export type AuthProvider = 'google' | 'facebook' | 'apple';

export async function authenticate(
  provider: AuthProvider,
  token: string,
  userData?: any
) {
  const url = `${getApiUrl()}/auth/${provider}/`;

  // Provider-specific token key mapping
  const tokenKeyMap: Record<AuthProvider, string> = {
    google: 'access_token',
    facebook: 'access_token',
    apple: 'access_token',
  };

  const tokenKey = tokenKeyMap[provider];
  let body: any = { [tokenKey]: token, ...userData };

  // For Apple, send both access_token and id_token with the same value
  if (provider === 'apple') {
    body = {
      access_token: token,
      id_token: token,
      ...userData,
    };
  }

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      // console.log('Social login failed:', text);
      throw new Error(`Social login failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Authentication timeout - please try again');
    }
    throw error;
  }
}

// Validate stored access token with backend
export async function validateToken(
  accessToken: string
): Promise<{ user: any }> {
  const url = `${getApiUrl()}/auth/token/verify/`;

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token: accessToken }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Token expired or invalid');
      }
      const text = await res.text();
      throw new Error(`Token validation failed: ${res.status} ${text}`);
    }

    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Token validation timeout - please try again');
    }
    throw error;
  }
}

// Refresh access token using refresh token from secure storage
let refreshingPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const url = `${getApiUrl()}/auth/token/refresh/`;

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // Clear tokens if refresh fails
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        return null;
      }

      const data = await res.json();
      const newAccess: string | undefined = data?.access || data?.access_token;
      const newRefresh: string | undefined =
        data?.refresh || data?.refresh_token;

      if (newAccess) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccess);
      }
      if (newRefresh) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefresh);
      }

      return newAccess || null;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Token refresh timeout');
      }
      return null;
    }
  } catch (err) {
    return null;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshingPromise) {
    refreshingPromise = performTokenRefresh().finally(() => {
      refreshingPromise = null;
    });
  }
  return refreshingPromise;
}

// Logout from backend
export async function logout(): Promise<void> {
  const url = `${getApiUrl()}/auth/logout/`;
  console.log('logout', url);
  try {
    // Read refresh token from secure storage
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

    // Create an AbortController for timeout similar to other auth calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken || '' }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        'Logout request failed:',
        response.status,
        response.statusText
      );
      // Don't throw error - we still want to clear local data even if backend logout fails
    }
  } catch (error) {
    console.warn('Logout request error:', error);
    // Don't throw error - we still want to clear local data even if backend logout fails
  }
}

// Helper function to make API requests with credentials and error handling
async function fetchWithCredentials(
  url: string,
  options: RequestInit = {},
  useLocale: boolean = true
): Promise<Response> {
  // Check if we should attempt network requests
  if (!shouldAttemptNetworkRequest()) {
    throw new Error('No internet connection available');
  }

  // Append language parameter similarly to web to get translated content
  if (useLocale) {
    const locale = (i18n?.locale || 'pl').toLowerCase();

    const urlParts = url.split('?');
    const baseUrl = urlParts[0];
    const existingParams = urlParts[1];

    const searchParams = new URLSearchParams(existingParams || '');
    searchParams.set('lang', locale);

    url = `${baseUrl}?${searchParams.toString()}`;
  }

  // Add Authorization header if we have an access token
  let authHeaders: Record<string, string> = {};
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  } catch {}

  console.log('authHeaders', authHeaders);

  const makeRequest = async (overrideAuth?: string): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    } as any;
    if (overrideAuth) headers['Authorization'] = `Bearer ${overrideAuth}`;

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    console.log('headers', headers);
    console.log('url', `${getApiUrl()}${url}`);
    try {
      const response = await fetch(`${getApiUrl()}${url}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  };

  let response = await makeRequest();

  // Attempt refresh on unauthorized once, except when calling auth endpoints
  if (
    response.status === 401 &&
    typeof url === 'string' &&
    !url.includes('/auth/token/refresh') &&
    !url.includes('/auth/token/verify')
  ) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      response = await makeRequest(newAccess);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData && (errorData.error || errorData.detail)) ||
      'An error occurred';
    throw new Error(`${response.status}: ${errorMessage}`);
  }

  return response;
}

// Events API
export const eventsApi = {
  // Get all events
  async getEvents(): Promise<Event[]> {
    const response = await fetchWithCredentials('/events/');
    return await response.json();
  },

  // Get upcoming events only
  async getUpcomingEvents(): Promise<Event[]> {
    const response = await fetchWithCredentials('/events/upcoming/');
    return await response.json();
  },

  // Get verified events only
  async getVerifiedEvents(): Promise<Event[]> {
    const response = await fetchWithCredentials('/events/verified/');
    return await response.json();
  },

  // Get events by category
  async getEventsByCategory(categorySlug: string): Promise<Event[]> {
    const response = await fetchWithCredentials(
      `/events/?category__slug=${categorySlug}`
    );
    return await response.json();
  },

  // Get events by organization
  async getEventsByOrganization(organizationSlug: string): Promise<Event[]> {
    const response = await fetchWithCredentials(
      `/events/?organization__slug=${organizationSlug}`
    );
    return await response.json();
  },

  // Search events
  async searchEvents(query: string): Promise<Event[]> {
    const response = await fetchWithCredentials(
      `/events/?search=${encodeURIComponent(query)}`
    );
    return await response.json();
  },

  // Get single event
  async getEvent(eventId: string): Promise<Event> {
    const response = await fetchWithCredentials(`/events/${eventId}/`);
    return await response.json();
  },

  // Get single event by slug
  async getEventBySlug(slug: string): Promise<Event> {
    const response = await fetchWithCredentials(`/events/${slug}/`);
    return await response.json();
  },

  // Note: getEventPosts and getEventSchedule are no longer needed
  // as posts and schedule are now included in getEventBySlug response

  // Like an event by slug
  async like(slug: string): Promise<{ liked: boolean }> {
    const response = await fetchWithCredentials(`/events/${slug}/likes/`, {
      method: 'POST',
    });
    console.log('response', response);
    return await response.json();
  },

  // Unlike an event by slug
  async unlike(slug: string): Promise<void> {
    await fetchWithCredentials(`/events/${slug}/likes/`, {
      method: 'DELETE',
    });
  },

  // Scan QR code for event participation
  async scanQRCode(code: string): Promise<any> {
    const response = await fetchWithCredentials('/scan-qr/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    return await response.json();
  },
};

// Categories API
export const categoriesApi = {
  async getCategories(): Promise<Category[]> {
    const response = await fetchWithCredentials('/categories/');
    return await response.json();
  },

  async getCategory(categorySlug: string): Promise<Category> {
    const response = await fetchWithCredentials(`/categories/${categorySlug}/`);
    return await response.json();
  },
};

// Organizations API
export const organizationsApi = {
  async getOrganizations(): Promise<Organization[]> {
    const response = await fetchWithCredentials('/organizations/');
    return await response.json();
  },

  async getOrganization(organizationSlug: string): Promise<Organization> {
    const response = await fetchWithCredentials(
      `/organizations/${organizationSlug}/`
    );
    return await response.json();
  },
};

// Notifications API
export const notificationsApi = {
  // Register or update device for push notifications
  async registerDevice(deviceData: {
    expoPushToken: string;
    platform: string;
    deviceName?: string;
    appVersion?: string;
    notificationsEnabled?: boolean;
  }) {
    const response = await fetchWithCredentials('/api/devices/', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
    return await response.json();
  },
};

// Export all APIs
export const api = {
  events: eventsApi,
  categories: categoriesApi,
  organizations: organizationsApi,
  notifications: notificationsApi,
  baseUrl: getApiUrl(),
};
