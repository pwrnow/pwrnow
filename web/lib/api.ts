import {
  Organization,
  Event,
  Category,
  Tag,
  AuthenticateResponse,
  AuthenticateRequest,
  ApiError,
  CreateEventData,
  Post,
  CreatePostData,
  Schedule,
  ScheduleItem,
  CreateScheduleItemData,
} from './types';
import { getApiUrl } from './config';
import { getUserLocale } from './locale';

async function fetchWithCredentials(
  url: string,
  options: RequestInit = {},
  useLocale: boolean = true
): Promise<Response> {
  // Don't set Content-Type for FormData - let the browser set it automatically
  const isFormData = options.body instanceof FormData;

  // TODO: Insteed of detecting locale here pass it as a paramter from endpoint
  if (useLocale) {
    const locale = await getUserLocale();

    // Parse the URL to properly handle existing parameters
    const urlParts = url.split('?');
    const baseUrl = urlParts[0];
    const existingParams = urlParts[1];

    // Create URLSearchParams to properly manage query parameters
    const searchParams = new URLSearchParams(existingParams || '');
    searchParams.set('lang', locale);

    // Reconstruct the URL with the locale parameter
    url = `${baseUrl}?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type to application/json if it's not FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${getApiUrl()}${url}`, {
    ...options,
    credentials: 'include',
    headers,
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
      `/organizations/authenticate/`,
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
    const response = await fetchWithCredentials(`/organizations/current/`);
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
    const response = await fetchWithCredentials(`/organizations/logout/`, {
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
    const response = await fetchWithCredentials(`/events/upcoming/`);
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
    const response = await fetchWithCredentials(`/events/verified/`);
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
    const response = await fetchWithCredentials(`/categories/`);
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
    const response = await fetchWithCredentials(`/tags/`);
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
  formData.append('publication_date', eventData.publication_date);
  if (eventData.location) formData.append('location', eventData.location);
  if (eventData.url) formData.append('url', eventData.url);
  if (eventData.category_slug)
    formData.append('category_slug', eventData.category_slug);
  if (eventData.image) formData.append('image', eventData.image);

  try {
    const response = await fetchWithCredentials('/events/', {
      method: 'POST',
      body: formData, // Don't set Content-Type for FormData
    });

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
    const response = await fetchWithCredentials(
      `/organizations/${slug}/image/`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const organization = await response.json();
    console.log('✅ Organization image uploaded successfully');
    return organization;
  } catch (error) {
    console.error('❌ Failed to upload organization image:', error);
    throw error;
  }
}

// Note: getEventPosts is no longer needed as posts are now included in getEventBySlug response

export async function createPost(data: CreatePostData): Promise<Post> {
  console.log('📝 Creating post:', data);

  try {
    const formData = new FormData();
    formData.append('event_slug', data.event_slug);

    if (data.text) {
      formData.append('text', data.text);
    }

    if (data.images && data.images.length > 0) {
      data.images.forEach((image, index) => {
        formData.append(`images`, image);
        formData.append(`image_order_${index}`, index.toString());
      });
    }

    const response = await fetchWithCredentials('/posts/', {
      method: 'POST',
      body: formData,
    });

    const post = await response.json();
    console.log('✅ Post created successfully:', post.id);

    return post;
  } catch (error) {
    console.error('❌ Failed to create post:', error);
    throw error;
  }
}

export async function deletePost(postId: string): Promise<void> {
  console.log('🗑️ Deleting post:', postId);

  try {
    await fetchWithCredentials(`/posts/${postId}/`, {
      method: 'DELETE',
    });
    console.log('✅ Post deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete post:', error);
    throw error;
  }
}

// Note: getEventSchedule is no longer needed as schedule is now included in getEventBySlug response

export async function createScheduleItem(
  data: CreateScheduleItemData
): Promise<ScheduleItem> {
  console.log('➕ Creating schedule item for event:', data.event_slug, data);
  try {
    const response = await fetchWithCredentials('/schedule-items/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const item = (await response.json()) as ScheduleItem;
    console.log('✅ Schedule item created:', item.id);
    return item;
  } catch (error) {
    console.error('❌ Failed to create schedule item:', error);
    throw error;
  }
}

export interface MagicImportRequest {
  raw_text: string;
}

export interface MagicImportResponse {
  id: string;
  items: Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    title: string;
    description?: string;
    duration_minutes: number;
  }>;
}

export async function parseScheduleWithAI(
  data: MagicImportRequest
): Promise<MagicImportResponse> {
  console.log('🤖 Parsing schedule with AI:', data);
  try {
    const response = await fetchWithCredentials('/ai/parse-schedule/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = (await response.json()) as MagicImportResponse;
    console.log('✅ Schedule parsed with AI:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to parse schedule with AI:', error);
    throw error;
  }
}

export async function deleteScheduleItem(itemId: string): Promise<void> {
  console.log('🗑️ Deleting schedule item:', itemId);
  try {
    await fetchWithCredentials(`/schedule-items/${itemId}/`, {
      method: 'DELETE',
    });
    console.log('✅ Schedule item deleted');
  } catch (error) {
    console.error('❌ Failed to delete schedule item:', error);
    throw error;
  }
}

export async function deleteEvent(eventSlug: string): Promise<void> {
  console.log('🗑️ Deleting event:', eventSlug);
  try {
    await fetchWithCredentials(`/events/${eventSlug}/`, {
      method: 'DELETE',
    });
    console.log('✅ Event deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete event:', error);
    throw error;
  }
}
