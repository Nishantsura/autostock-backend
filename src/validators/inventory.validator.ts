import { z } from 'zod';

export const inventoryAdjustSchema = z.object({
  companyId: z.string().uuid(),
  skuId: z.string().uuid(),
  storeId: z.string().uuid(),
  binId: z.string().uuid().optional(),
  qtyBefore: z.number().int(),
  qtyAfter: z.number().int(),
  reason: z.string().min(1),
});

export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>;



