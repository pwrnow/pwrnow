export const SOCIAL_LINKS = {
  FACEBOOK: 'https://www.facebook.com/pwrnow',
  INSTAGRAM: 'https://www.instagram.com/pwr_now/',
  MESSENGER: 'https://m.me/pwrnow',
  TIKTOK: 'https://www.tiktok.com/@pwrnow',
  LINKEDIN: 'https://www.linkedin.com/company/pwrnow',
  EMAIL: 'mailto:contact@pwrnow.pl',
  WEBSITE: 'https://pwrnow.pl',
};

export const SOCIAL_MEDIA_CONFIG = [
  {
    id: 'facebook',
    name: 'Facebook',
    url: SOCIAL_LINKS.FACEBOOK,
    icon: 'logo-facebook' as const,
    color: '#1877F2',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: SOCIAL_LINKS.INSTAGRAM,
    icon: 'logo-instagram' as const,
    color: '#E4405F',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    url: SOCIAL_LINKS.MESSENGER,
    icon: 'chatbubble' as const,
    color: '#006AFF',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: SOCIAL_LINKS.TIKTOK,
    icon: 'logo-tiktok' as const,
    color: '#FFFFFF',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: SOCIAL_LINKS.LINKEDIN,
    icon: 'logo-linkedin' as const,
    color: '#0077B5',
  },
];
