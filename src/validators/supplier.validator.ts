import { z } from 'zod';

export const createSupplierSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1),
  contact: z.string().optional(),
  leadTimeDays: z.number().int().positive().optional(),
  moq: z.number().int().positive().optional(),
  paymentTerms: z.string().optional(),
});

export const listSuppliersQuerySchema = z.object({
  companyId: z.string().uuid(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
