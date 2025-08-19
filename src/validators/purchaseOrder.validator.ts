import { z } from 'zod';

export const createPOLineSchema = z.object({
  skuId: z.string().uuid(),
  qtyOrdered: z.number().int().positive(),
  unitCost: z.number().positive(),
  landedCostComponents: z.any().optional(),
});

export const createPOSchema = z.object({
  companyId: z.string().uuid(),
  supplierId: z.string().uuid(),
  poNumber: z.string().min(1),
  expectedDelivery: z.string().datetime().optional(),
  lines: z.array(createPOLineSchema).min(1),
});

export const receivePOSchema = z.object({
  lines: z
    .array(
      z.object({
        poLineId: z.string().uuid(),
        qtyReceived: z.number().int().positive(),
        binId: z.string().uuid().optional(),
      })
    )
    .min(1),
});

export type CreatePOInput = z.infer<typeof createPOSchema>;
export type ReceivePOInput = z.infer<typeof receivePOSchema>;
