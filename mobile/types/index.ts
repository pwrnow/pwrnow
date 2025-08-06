export interface Organization {
  id: string;
  name: string;
  image_url: string | null;
}

export interface Category {
  name: string;
  slug: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  image_url: string | null;
  url: string | null;
  verified?: boolean;
  is_new?: boolean;
  aspect_ratio?: string | null;
  organization: Organization;
  category: Category;
}
