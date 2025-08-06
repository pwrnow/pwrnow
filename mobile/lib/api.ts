import { Event, Category, Organization } from '../types';
import { getApiUrl } from './config';

// Helper function to make API requests with credentials and error handling
async function fetchWithCredentials(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
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
