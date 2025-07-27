import { Event, Category, Organization } from '../types';
import { getApiUrl } from './config';

// Helper function to make API requests
async function apiRequest<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(getApiUrl(endpoint));

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Events API
export const eventsApi = {
  // Get all events
  async getEvents(): Promise<Event[]> {
    return await apiRequest<Event[]>('/events/');
  },

  // Get upcoming events only
  async getUpcomingEvents(): Promise<Event[]> {
    return await apiRequest<Event[]>('/events/upcoming/');
  },

  // Get verified events only
  async getVerifiedEvents(): Promise<Event[]> {
    return await apiRequest<Event[]>('/events/verified/');
  },

  // Get events by category
  async getEventsByCategory(categorySlug: string): Promise<Event[]> {
    return await apiRequest<Event[]>(`/events/?category__slug=${categorySlug}`);
  },

  // Get events by organization
  async getEventsByOrganization(organizationSlug: string): Promise<Event[]> {
    return await apiRequest<Event[]>(
      `/events/?organization__slug=${organizationSlug}`
    );
  },

  // Search events
  async searchEvents(query: string): Promise<Event[]> {
    return await apiRequest<Event[]>(
      `/events/?search=${encodeURIComponent(query)}`
    );
  },

  // Get single event
  async getEvent(eventId: string): Promise<Event> {
    return await apiRequest<Event>(`/events/${eventId}/`);
  },

  // Get single event by slug
  async getEventBySlug(slug: string): Promise<Event> {
    return await apiRequest<Event>(`/events/${slug}/`);
  },
};

// Categories API
export const categoriesApi = {
  async getCategories(): Promise<Category[]> {
    return await apiRequest<Category[]>('/categories/');
  },

  async getCategory(categorySlug: string): Promise<Category> {
    return await apiRequest<Category>(`/categories/${categorySlug}/`);
  },
};

// Organizations API
export const organizationsApi = {
  async getOrganizations(): Promise<Organization[]> {
    return await apiRequest<Organization[]>('/organizations/');
  },

  async getOrganization(organizationSlug: string): Promise<Organization> {
    return await apiRequest<Organization>(
      `/organizations/${organizationSlug}/`
    );
  },
};

// Export all APIs
export const api = {
  events: eventsApi,
  categories: categoriesApi,
  organizations: organizationsApi,
};
