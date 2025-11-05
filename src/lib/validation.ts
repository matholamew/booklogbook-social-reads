import { z } from 'zod';

// Book validation schemas
export const bookInputSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(500, "Title must be less than 500 characters"),
  author: z.string()
    .trim()
    .min(1, "Author is required")
    .max(200, "Author must be less than 200 characters"),
  status: z.enum(['planned', 'reading', 'finished']).optional(),
  dateStarted: z.string().optional(),
  dateFinished: z.string().optional(),
  notes: z.string()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .transform(val => val || undefined),
});

export const bookUpdateSchema = z.object({
  status: z.enum(['planned', 'reading', 'finished']),
  dateStarted: z.string().optional(),
  dateFinished: z.string().optional(),
  notes: z.string()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .transform(val => val || undefined),
});

// Profile validation schemas
export const profileUpdateSchema = z.object({
  username: z.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  display_name: z.string()
    .trim()
    .min(1, "Display name is required")
    .max(50, "Display name must be less than 50 characters"),
  bio: z.string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .transform(val => val || undefined),
});

// Author validation schema
export const authorInputSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Author name is required")
    .max(200, "Author name must be less than 200 characters"),
  bio: z.string()
    .max(1000, "Bio must be less than 1000 characters")
    .optional()
    .transform(val => val || undefined),
});

export type BookInput = z.infer<typeof bookInputSchema>;
export type BookUpdate = z.infer<typeof bookUpdateSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type AuthorInput = z.infer<typeof authorInputSchema>;
