export const queryKeys = {
  events: ['events'] as const,
  categories: ['categories'] as const,
  eventBySlug: (slug: string) => ['event', slug] as const,
  eventSchedule: (slug: string) => ['event', slug, 'schedule'] as const,
};

export type QueryKey =
  | ReturnType<typeof queryKeys.eventBySlug>
  | ReturnType<typeof queryKeys.eventSchedule>
  | typeof queryKeys.events
  | typeof queryKeys.categories;
