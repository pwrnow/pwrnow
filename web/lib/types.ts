// Extracted types from api.ts

export interface Organization {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  publication_date?: string;
  location?: string;
  image_url?: string;
  url?: string;
  verified: boolean;
  is_new?: boolean;
  aspect_ratio?: string;
  organization: Organization;
  category: Category;
  posts?: Post[];
  schedule?: Schedule | null;
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
  publication_date: string;
  location?: string;
  url?: string;
  category_slug?: string;
  image: File;
}

export interface PostImage {
  id: string;
  url: string;
  aspect_ratio?: string | null;
  order_index: number;
}

export interface Post {
  id: string;
  created_at: string;
  text: string | null;
  organization: Organization;
  images: PostImage[];
  verified: boolean;
}

export interface CreatePostData {
  event_slug: string;
  text?: string;
  images?: File[];
}

// Schedule types
export interface ScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  title: string;
  description?: string | null;
  duration_minutes?: number;
}

export interface Schedule {
  id: string;
  items: ScheduleItem[];
}

export interface CreateScheduleItemData {
  event_slug: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  title: string;
  description?: string;
}
