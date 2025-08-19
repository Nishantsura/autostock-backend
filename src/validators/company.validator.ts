import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  taxRegistration: z.string().optional(),
  defaultValuationMethod: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
