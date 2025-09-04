import { z } from 'zod';

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Tytuł jest wymagany')
      .max(100, 'Tytuł nie może być dłuższy niż 100 znaków'),
    categorySlug: z.string().min(1, { error: 'Kategoria jest wymagana' }),
    startsAt: z.date({
      error: (issue) =>
        issue.input === undefined
          ? 'Data rozpoczęcia jest wymagana'
          : 'Nieprawidłowa data rozpoczęcia',
    }),
    endsAt: z.date({
      error: (issue) =>
        issue.input === undefined
          ? 'Data zakończenia jest wymagana'
          : 'Nieprawidłowa data zakończenia',
    }),
    publicationDate: z.date({
      error: (issue) =>
        issue.input === undefined
          ? 'Data publikacji jest wymagana'
          : 'Nieprawidłowa data publikacji',
    }),
    location: z
      .string()
      .max(200, 'Lokalizacja nie może być dłuższa niż 200 znaków')
      .optional(),
    url: z
      .url()
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
      path: ['endsAt'],
      error: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
    }
  )
  .refine(
    (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return data.publicationDate > today;
    },
    {
      path: ['publicationDate'],
      error:
        'Data publikacji musi być w przyszłości (nie dzisiaj ani wcześniej)',
    }
  )
  .refine(
    (data) => {
      const publicationDate = new Date(data.publicationDate);
      publicationDate.setHours(0, 0, 0, 0);
      const startDate = new Date(data.startsAt);
      startDate.setHours(0, 0, 0, 0);
      return publicationDate <= startDate;
    },
    {
      path: ['publicationDate'],
      error:
        'Data publikacji nie może być późniejsza niż data rozpoczęcia wydarzenia',
    }
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;

export interface EventFormData extends EventFormValues {
  imageFile?: File | null;
}

export function formToApiData(
  formData: EventFormValues,
  imageFile: File
): {
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  publication_date: string;
  location?: string;
  url?: string;
  category_slug?: string;
  image: File;
} {
  return {
    title: formData.title,
    description: formData.description || undefined,
    starts_at: formData.startsAt.toISOString(),
    ends_at: formData.endsAt.toISOString(),
    publication_date: `${formData.publicationDate.getFullYear()}-${String(
      formData.publicationDate.getMonth() + 1
    ).padStart(2, '0')}-${String(formData.publicationDate.getDate()).padStart(
      2,
      '0'
    )}`,
    location: formData.location || undefined,
    url: formData.url || undefined,
    category_slug: formData.categorySlug,
    image: imageFile,
  };
}
