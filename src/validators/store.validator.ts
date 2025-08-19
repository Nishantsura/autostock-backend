import { z } from 'zod';

export const createStoreSchema = z.object({
  companyId: z.string().uuid(),
  type: z.enum(['retail', 'warehouse']).or(z.string().min(1)),
  name: z.string().min(1),
  address: z.string().optional(),
  posIntegration: z.any().optional(),
  contactPerson: z.string().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
