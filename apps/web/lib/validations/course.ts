import { z } from "zod";

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Course title must be at least 3 characters")
    .max(100, "Course title must be less than 100 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),

  category: z
    .string()
    .trim()
    .min(2, "Category is required")
    .max(50, "Category must be less than 50 characters"),

  thumbnail_url: z
    .string()
    .url("Invalid thumbnail URL")
    .nullable()
    .optional(),
});

export type CourseInput = z.infer<typeof courseSchema>;