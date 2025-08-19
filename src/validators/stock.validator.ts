import { z } from 'zod';

export const stockQuerySchema = z.object({
  companyId: z.string().uuid(),
  skuId: z.string().uuid().optional(),
  storeId: z.string().uuid().optional(),
});

export const stockInSchema = z.object({
  companyId: z.string().uuid(),
  storeId: z.string().uuid(),
  skuId: z.string().uuid(),
  binId: z.string().uuid().optional(),
  qty: z.number().int().positive(),
  source: z.enum(['po', 'manual', 'transfer']),
  referenceId: z.string().optional(),
});

export const stockOutSchema = z.object({
  companyId: z.string().uuid(),
  storeId: z.string().uuid(),
  skuId: z.string().uuid(),
  binId: z.string().uuid().optional(),
  qty: z.number().int().positive(),
  reason: z.enum(['sale', 'transfer', 'damage']),
  referenceId: z.string().optional(),
});

export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
