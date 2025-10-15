export const CATEGORY_SLUGS = {
  REKRUTACJA: 'rekrutacja',
} as const;

export type CategorySlug = typeof CATEGORY_SLUGS[keyof typeof CATEGORY_SLUGS];


