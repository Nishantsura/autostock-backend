import { z } from 'zod';

export const createCategorySchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
