import { Event, Category, Organization, Post, User, SearchedUser, FriendRequest, Friend, FriendSuggestion, ProfileImageChangeRequest } from '../types';
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
): Promise<void> {
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

    await res.json();
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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for production reliability

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

  // Avoid logging auth headers in production

  const makeRequest = async (overrideAuth?: string): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    } as any;
    if (overrideAuth) headers['Authorization'] = `Bearer ${overrideAuth}`;

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for production reliability
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

    // Create error with status property for better error detection
    const error = new Error(`${response.status}: ${errorMessage}`);
    (error as any).status = response.status;
    throw error;
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
    // No console noise in production
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

  // Verify an event (staff only)
  async verifyEvent(slug: string): Promise<Event> {
    const response = await fetchWithCredentials(`/events/${slug}/verify/`, {
      method: 'POST',
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

// User API
export const userApi = {
  // Update username (one-time only)
  async updateUsername(username: string): Promise<User> {
    const response = await fetchWithCredentials('/user/username/', {
      method: 'PATCH',
      body: JSON.stringify({ username }),
    });
    return await response.json();
  },

  // Check if username is available
  async checkUsername(
    username: string
  ): Promise<{ available: boolean; errors?: any }> {
    const response = await fetchWithCredentials('/user/username/check/', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    return await response.json();
  },

  // Get current user details
  async getCurrentUser(): Promise<User> {
    const response = await fetchWithCredentials('/user/');
    return await response.json();
  },

  // Upload profile image
  async uploadProfileImage(imageUri: string): Promise<User> {
    const formData = new FormData();

    // Get file extension and mime type
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: `profile.${fileType}`,
      type: mimeType,
    } as any);

    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

    const response = await fetch(`${getApiUrl()}/user/profile-image/`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Profile image upload failed:', response.status, text);
      let errorMessage = 'Failed to upload profile image';
      try {
        const errorData = JSON.parse(text);
        if (errorData.error) errorMessage = errorData.error;
        else if (errorData.detail) errorMessage = errorData.detail;
      } catch (e) {
        // If JSON parsing fails, use text or default message
        if (text && text.length < 100) errorMessage = text;
      }

      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }

    return await response.json();
  },

  // Delete profile image
  async deleteProfileImage(): Promise<User> {
    const response = await fetchWithCredentials('/user/profile-image/', {
      method: 'DELETE',
    });
    return await response.json();
  },
};

// Admin API (for staff users)
export const adminApi = {
  // Get pending profile image requests
  async getPendingProfileImageRequests(): Promise<ProfileImageChangeRequest[]> {
    const response = await fetchWithCredentials('/profile-image-requests/');
    return await response.json();
  },

  // Approve profile image request
  async approveProfileImageRequest(requestId: string): Promise<ProfileImageChangeRequest> {
    const response = await fetchWithCredentials(`/profile-image-requests/${requestId}/approve/`, {
      method: 'POST',
    });
    return await response.json();
  },

  // Reject profile image request
  async rejectProfileImageRequest(requestId: string, feedback: string): Promise<ProfileImageChangeRequest> {
    const response = await fetchWithCredentials(`/profile-image-requests/${requestId}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
    return await response.json();
  },
};

// Friendship API
const friendsApi = {
  // Search users by username
  searchUsers: async (query: string): Promise<SearchedUser[]> => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      return [];
    }

    const response = await fetchWithCredentials(`/users/search/?q=${encodeURIComponent(trimmedQuery)}`);
    return await response.json();
  },

  // Get list of friends
  getFriends: async (): Promise<Friend[]> => {
    const response = await fetchWithCredentials('/friends/');
    return await response.json();
  },

  // Get friend suggestions
  getSuggestedFriends: async (): Promise<FriendSuggestion[]> => {
    console.log('[API] Fetching friend suggestions');
    const response = await fetchWithCredentials('/friends/suggestions/');
    const data = await response.json();
    console.log('[API] Friend suggestions response:', data);
    return data;
  },

  // Remove a friend
  removeFriend: async (friendId: string): Promise<void> => {
    await fetchWithCredentials(`/friends/${friendId}/remove/`, {
      method: 'DELETE',
    });
  },

  // Get pending friend requests
  getFriendRequests: async (): Promise<FriendRequest[]> => {
    const response = await fetchWithCredentials('/friend-requests/');
    return await response.json();
  },

  // Send a friend request
  sendFriendRequest: async (toUserId: string): Promise<FriendRequest> => {
    const response = await fetchWithCredentials('/friend-requests/send/', {
      method: 'POST',
      body: JSON.stringify({ to_user_id: toUserId }),
    });
    return await response.json();
  },

  // Accept a friend request
  acceptFriendRequest: async (requestId: string): Promise<void> => {
    await fetchWithCredentials(`/friend-requests/${requestId}/accept/`, {
      method: 'POST',
    });
  },

  // Reject a friend request
  rejectFriendRequest: async (requestId: string): Promise<void> => {
    await fetchWithCredentials(`/friend-requests/${requestId}/reject/`, {
      method: 'POST',
    });
  },
};

// Export all APIs
export const api = {
  events: eventsApi,
  categories: categoriesApi,
  organizations: organizationsApi,
  notifications: notificationsApi,
  user: userApi,
  friends: friendsApi,
  admin: adminApi,
  baseUrl: getApiUrl(),
};
