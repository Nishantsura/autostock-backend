import { z } from 'zod';

export const createSkuSchema = z.object({
  productId: z.string().uuid(),
  skuCode: z.string().min(1),
  barcode: z.string().optional(),
  mpn: z.string().optional(),
  model: z.string().optional(),
  unitOfMeasure: z.string().default('pcs').optional(),
  packSize: z.number().int().positive().default(1).optional(),
  isTrackedByLot: z.boolean().default(false).optional(),
  isTrackedBySerial: z.boolean().default(false).optional(),
});

export type CreateSkuInput = z.infer<typeof createSkuSchema>;
