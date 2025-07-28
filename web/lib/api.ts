import {
  Organization,
  Event,
  Category,
  Tag,
  AuthenticateResponse,
  AuthenticateRequest,
  ApiError,
  CreateEventData,
} from './types';
import { getApiUrl } from './config';

async function fetchWithCredentials(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(getApiUrl(url), {
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
    throw new ApiError(response.status, errorMessage, errorData.details);
  }

  return response;
}

// Organization endpoints
export async function authenticateOrganization(
  code: string
): Promise<AuthenticateResponse> {
  if (!code || code.trim().length === 0) {
    throw new ApiError(400, 'Organization code is required');
  }

  const requestData: AuthenticateRequest = {
    code: code.trim(),
  };

  console.log('🔐 Authenticating organization with code:', code.trim());

  try {
    const response = await fetchWithCredentials(
      '/organizations/authenticate/',
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      }
    );

    const data = await response.json();
    console.log('✅ Authentication successful:', data);
    return data;
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    if (error instanceof ApiError) {
      // Handle specific backend validation errors
      if (error.details && error.details.code) {
        const codeErrors = error.details.code;
        if (Array.isArray(codeErrors) && codeErrors.length > 0) {
          throw new ApiError(error.status, codeErrors[0], error.details);
        }
      }
    }
    throw error;
  }
}

export async function getCurrentOrganization(): Promise<Organization> {
  console.log('🏢 Getting current organization from session');
  try {
    const response = await fetchWithCredentials('/organizations/current/');
    const data = await response.json();
    console.log('✅ Current organization:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to get current organization:', error);
    throw error;
  }
}

export async function logoutOrganization(): Promise<{ message: string }> {
  console.log('🚪 Logging out organization');
  try {
    const response = await fetchWithCredentials('/organizations/logout/', {
      method: 'POST',
    });
    const data = await response.json();
    console.log('✅ Logout successful:', data);
    return data;
  } catch (error) {
    console.error('❌ Logout failed:', error);
    throw error;
  }
}

// Event endpoints
export async function getEvents(params?: {
  upcoming?: boolean;
  verified?: boolean;
  search?: string;
}): Promise<Event[]> {
  const searchParams = new URLSearchParams();

  if (params?.upcoming) {
    searchParams.append('upcoming', 'true');
  }
  if (params?.verified) {
    searchParams.append('verified', 'true');
  }
  if (params?.search) {
    searchParams.append('search', params.search);
  }

  const url = `/events/${
    searchParams.toString() ? '?' + searchParams.toString() : ''
  }`;
  console.log('📅 Loading events:', url);

  try {
    const response = await fetchWithCredentials(url);
    const events = await response.json();
    console.log('✅ Events loaded:', events.length, 'events');

    return events;
  } catch (error) {
    console.error('❌ Failed to load events:', error);
    throw error;
  }
}

export async function getUpcomingEvents(): Promise<Event[]> {
  console.log('🔮 Loading upcoming events');
  try {
    const response = await fetchWithCredentials('/events/upcoming/');
    const events = await response.json();
    console.log('✅ Upcoming events loaded:', events.length, 'events');
    return events;
  } catch (error) {
    console.error('❌ Failed to load upcoming events:', error);
    throw error;
  }
}

export async function getVerifiedEvents(): Promise<Event[]> {
  console.log('✅ Loading verified events');
  try {
    const response = await fetchWithCredentials('/events/verified/');
    const events = await response.json();
    console.log('✅ Verified events loaded:', events.length, 'events');
    return events;
  } catch (error) {
    console.error('❌ Failed to load verified events:', error);
    throw error;
  }
}

// Fetch a single event by slug
export async function getEventBySlug(slug: string): Promise<Event> {
  if (!slug) throw new Error('Slug is required');
  try {
    const response = await fetchWithCredentials(`/events/${slug}/`);
    const event = await response.json();
    return event;
  } catch (error) {
    console.error('❌ Failed to load event by slug:', error);
    throw error;
  }
}

// Get events by category
export async function getEventsByCategory(
  categorySlug: string
): Promise<Event[]> {
  try {
    const response = await fetchWithCredentials(
      `/events/?category__slug=${categorySlug}`
    );
    const events = await response.json();
    return events;
  } catch (error) {
    console.error('❌ Failed to load events by category:', error);
    throw error;
  }
}

// Get events by organization
export async function getEventsByOrganization(
  organizationSlug: string
): Promise<Event[]> {
  try {
    const response = await fetchWithCredentials(
      `/events/?organization__slug=${organizationSlug}`
    );
    const events = await response.json();
    return events;
  } catch (error) {
    console.error('❌ Failed to load events by organization:', error);
    throw error;
  }
}

// Search events
export async function searchEvents(query: string): Promise<Event[]> {
  try {
    const response = await fetchWithCredentials(
      `/events/?search=${encodeURIComponent(query)}`
    );
    const events = await response.json();
    return events;
  } catch (error) {
    console.error('❌ Failed to search events:', error);
    throw error;
  }
}

// Category endpoints
export async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetchWithCredentials('/categories/');
    const categories = await response.json();
    return categories;
  } catch (error) {
    console.error('❌ Failed to load categories:', error);
    throw error;
  }
}

export async function getCategory(categorySlug: string): Promise<Category> {
  try {
    const response = await fetchWithCredentials(`/categories/${categorySlug}/`);
    const category = await response.json();
    return category;
  } catch (error) {
    console.error('❌ Failed to load category:', error);
    throw error;
  }
}

// Tag endpoints
export async function getTags(): Promise<Tag[]> {
  try {
    const response = await fetchWithCredentials('/tags/');
    const tags = await response.json();
    return tags;
  } catch (error) {
    console.error('❌ Failed to load tags:', error);
    throw error;
  }
}

// Event creation
export async function createEvent(eventData: CreateEventData): Promise<Event> {
  console.log('📝 Creating new event:', eventData.title);

  const formData = new FormData();

  formData.append('title', eventData.title);
  if (eventData.description)
    formData.append('description', eventData.description);
  formData.append('starts_at', eventData.starts_at);
  formData.append('ends_at', eventData.ends_at);
  if (eventData.location) formData.append('location', eventData.location);
  if (eventData.url) formData.append('url', eventData.url);
  if (eventData.category_slug)
    formData.append('category_slug', eventData.category_slug);
  if (eventData.image) formData.append('image', eventData.image);

  try {
    const response = await fetch(getApiUrl('/events/'), {
      method: 'POST',
      credentials: 'include',
      body: formData, // Don't set Content-Type for FormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.error || 'Failed to create event',
        errorData
      );
    }

    const event = await response.json();
    console.log('✅ Event created successfully:', event);
    return event;
  } catch (error) {
    console.error('❌ Failed to create event:', error);
    throw error;
  }
}

// Organization image upload
export async function uploadOrganizationImage(
  slug: string,
  image: File
): Promise<Organization> {
  console.log('🖼️ Uploading organization image for:', slug);

  const formData = new FormData();
  formData.append('image', image);

  try {
    const response = await fetch(getApiUrl(`/organizations/${slug}/image/`), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.error || 'Failed to upload image',
        errorData
      );
    }

    const organization = await response.json();
    console.log('✅ Organization image uploaded successfully');
    return organization;
  } catch (error) {
    console.error('❌ Failed to upload organization image:', error);
    throw error;
  }
}
