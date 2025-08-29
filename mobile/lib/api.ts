import { Event, Category, Organization } from '../types';
import { getApiUrl } from './config';
import i18n from './i18n';

export type AuthProvider = 'google' | 'facebook' | 'apple';

export async function authenticate(provider: AuthProvider, token: string) {
  const url = `${getApiUrl()}/auth/${provider}/`;
  const body = { access_token: token };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Social login failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Validate stored access token with backend
export async function validateToken(
  accessToken: string
): Promise<{ user: any }> {
  const url = `${getApiUrl()}/auth/token/verify/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token: accessToken }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Token expired or invalid');
    }
    const text = await res.text();
    throw new Error(`Token validation failed: ${res.status} ${text}`);
  }

  return res.json();
}

// Helper function to make API requests with credentials and error handling
async function fetchWithCredentials(
  url: string,
  options: RequestInit = {},
  useLocale: boolean = true
): Promise<Response> {
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

  const response = await fetch(`${getApiUrl()}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || 'An error occurred';
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
