// Cross-module constants used across the mobile app

export const CATEGORY_SLUGS = {
  REKRUTACJA: 'rekrutacja',
  WSZYSTKIE: 'wszystkie',
} as const;

export type CategorySlug = typeof CATEGORY_SLUGS[keyof typeof CATEGORY_SLUGS];


