export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  username_set_by_user: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login: string;
  profile_image_url?: string | null;
  pending_profile_image_url?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  image_url: string | null;
}

export interface Category {
  name: string;
  slug: string;
}

export interface EventMapLocation {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  order_index: number;
  image: string | null;
  is_active: boolean;
}

export interface EventMap {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  locations: EventMapLocation[];
  locations_count: number;
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
  likes_count?: number | null;
  is_published?: boolean;
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
  event_map?: EventMap | null;
  friends_interested?: {
    count: number;
    friends: { id: string; username: string; profile_image_url?: string | null }[];
  };
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

export interface FriendUser {
  id: string;
  username: string;
  profile_image_url?: string | null;
}

export interface SearchedUser {
  id: string;
  username: string;
  profile_image_url?: string | null;
  is_friend: boolean;
  has_pending_request: boolean;
  friendship_status: 'friend' | 'request_sent' | 'request_received' | 'none';
}

export interface FriendRequest {
  id: string;
  from_user: FriendUser;
  to_user: FriendUser;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Friend {
  id: string;
  username: string;
  profile_image_url?: string | null;
  friendship_id: string;
  friendship_created_at: string;
}

export interface FriendSuggestion {
  id: string;
  username: string;
  profile_image_url?: string | null;
  mutual_friends_count: number;
  source_friend: string | null;
}

export interface ProfileImageChangeRequest {
  id: string;
  user_id: string;
  username: string;
  user_email: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_feedback?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by_username?: string | null;
}

export interface FriendsAttendingResponse {
  count: number;
  friends: FriendUser[];
}
