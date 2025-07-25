// Extracted types from api.ts

export interface Organization {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  image_url?: string;
  url?: string;
  verified: boolean;
  is_new?: boolean;
  organization: Organization;
  category?: string; // This is the category slug, not an object
}

export interface Category {
  name: string;
  slug: string;
}

export interface Tag {
  name: string;
  slug: string;
}

export interface AuthenticateResponse {
  organization: Organization;
  message: string;
}

export interface AuthenticateRequest {
  code: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface CreateEventData {
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  url?: string;
  category_slug?: string;
  image?: File;
}
