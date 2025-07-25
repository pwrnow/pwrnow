import { z } from 'zod';

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Tytuł jest wymagany')
      .max(100, 'Tytuł nie może być dłuższy niż 100 znaków'),
    categorySlug: z.string().min(1, 'Kategoria jest wymagana'),
    startsAt: z.date({
      required_error: 'Data rozpoczęcia jest wymagana',
    }),
    endsAt: z.date({
      required_error: 'Data zakończenia jest wymagana',
    }),
    location: z
      .string()
      .max(200, 'Lokalizacja nie może być dłuższa niż 200 znaków')
      .optional(),
    url: z
      .string()
      .url('Nieprawidłowy format URL')
      .max(500, 'URL nie może być dłuższy niż 500 znaków')
      .optional()
      .or(z.literal('')),
    description: z
      .string()
      .max(2000, 'Opis nie może być dłuższy niż 2000 znaków')
      .optional(),
  })
  .refine(
    (data) => {
      return data.endsAt > data.startsAt;
    },
    {
      message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
      path: ['endsAt'],
    }
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;

export interface EventFormData extends EventFormValues {
  imageFile?: File | null;
}

export function formToApiData(
  formData: EventFormValues,
  imageFile?: File | null
): {
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  url?: string;
  category_slug?: string;
  image?: File;
} {
  return {
    title: formData.title,
    description: formData.description || undefined,
    starts_at: formData.startsAt.toISOString(),
    ends_at: formData.endsAt.toISOString(),
    location: formData.location || undefined,
    url: formData.url || undefined,
    category_slug: formData.categorySlug,
    image: imageFile || undefined,
  };
}
