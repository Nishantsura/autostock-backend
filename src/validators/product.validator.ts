import { z } from 'zod';

export const createProductSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(1),
  brand: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dimensions: z.any().optional(),
  weight: z.number().optional(),
  images: z.array(z.string()).optional(),
  attributes: z.any().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
