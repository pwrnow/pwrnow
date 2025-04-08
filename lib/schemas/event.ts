import * as z from 'zod';

// Base schema for shared validation rules
const eventBaseSchema = {
  title: z
    .string()
    .min(1, { message: 'Tytuł jest wymagany' })
    .max(100, { message: 'Tytuł nie może przekraczać 100 znaków' }),
  location: z
    .string()
    .min(1, { message: 'Lokalizacja jest wymagana' })
    .max(200, { message: 'Lokalizacja nie może przekraczać 200 znaków' }),
  description: z
    .string()
    .max(2000, { message: 'Opis nie może przekraczać 2000 znaków' })
    .optional(),
  categoryId: z.string().uuid({ message: 'Wybierz kategorię' }),
  url: z
    .string()
    .url({ message: 'Podaj prawidłowy adres URL' })
    .max(500, { message: 'URL nie może przekraczać 500 znaków' })
    .optional()
    .or(z.literal('')),
};

// Server-specific fields that extend the base schema
const serverBaseSchema = {
  ...eventBaseSchema,
  // For server, transform empty strings to null
  description: z
    .string()
    .max(2000, { message: 'Opis nie może przekraczać 2000 znaków' })
    .optional()
    .transform((val) => (val === '' ? null : val))
    .nullish(),
  url: z
    .string()
    .url({ message: 'Podaj prawidłowy adres URL' })
    .max(500, { message: 'URL nie może przekraczać 500 znaków' })
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val))
    .nullish(),
};

// Client-side form schema using Date objects
export const eventFormSchema = z
  .object({
    ...eventBaseSchema,
    startsAt: z.date({
      required_error: 'Wybierz datę i czas rozpoczęcia',
    }),
    endsAt: z.date({
      required_error: 'Wybierz datę i czas zakończenia',
    }),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
    path: ['endsAt'],
  });

// Type for form values (client-side)
export type EventFormValues = z.infer<typeof eventFormSchema>;

// Server-side schema that handles both form submission and API validation
export const eventServerSchema = z
  .object({
    ...serverBaseSchema,
    startsAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Nieprawidłowy format daty rozpoczęcia',
    }),
    endsAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Nieprawidłowy format daty zakończenia',
    }),
    organizationId: z.string().uuid(),
    orgCode: z.string(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
    path: ['endsAt'],
  });

// Type for server-side parameters
export type EventServerParams = z.infer<typeof eventServerSchema>;

// Utility function to transform form data to server data
export function formToServerData(
  formData: EventFormValues,
  organizationId: string,
  orgCode: string
): Omit<EventServerParams, 'imageFile'> {
  return {
    title: formData.title,
    startsAt: formData.startsAt.toISOString(),
    endsAt: formData.endsAt.toISOString(),
    location: formData.location,
    description: formData.description || null,
    categoryId: formData.categoryId,
    url: formData.url || null,
    organizationId,
    orgCode,
  };
}
