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
  publication_date: string;
  location: string | null;
  image_url: string | null;
  url: string | null;
  verified?: boolean;
  is_new?: boolean;
  aspect_ratio?: string | null;
  liked?: boolean;
  participation_status?: boolean;
  organization: Organization;
  category: Category;
  posts?: Post[];
  schedule?: {
    id: string;
    items: Array<{
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      title: string;
      description: string | null;
      duration: string;
    }>;
  } | null;
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
}
