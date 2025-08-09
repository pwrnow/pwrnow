export const queryKeys = {
  events: ['events'] as const,
  categories: ['categories'] as const,
  eventBySlug: (slug: string) => ['event', slug] as const,
};

export type QueryKey =
  | ReturnType<typeof queryKeys.eventBySlug>
  | typeof queryKeys.events
  | typeof queryKeys.categories;
