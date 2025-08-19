import { z } from 'zod';

export const createZoneSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1),
});
export type CreateZoneInput = z.infer<typeof createZoneSchema>;

export const createAisleSchema = z.object({
  zoneId: z.string().uuid(),
  name: z.string().min(1),
});
export type CreateAisleInput = z.infer<typeof createAisleSchema>;

export const createRackSchema = z.object({
  aisleId: z.string().uuid(),
  name: z.string().min(1),
  rows: z.number().int().positive().optional(),
});
export type CreateRackInput = z.infer<typeof createRackSchema>;

export const createShelfSchema = z.object({
  rackId: z.string().uuid(),
  level: z.number().int().min(1),
});
export type CreateShelfInput = z.infer<typeof createShelfSchema>;

export const createBinSchema = z.object({
  shelfId: z.string().uuid(),
  code: z.string().min(1),
  barcode: z.string().optional(),
  maxQtyUnits: z.number().int().positive().optional(),
  maxVolumeM3: z.number().positive().optional(),
  maxWeightKg: z.number().positive().optional(),
  temperatureCtrl: z.boolean().optional(),
  allowedProductTags: z.array(z.string()).optional(),
});
export type CreateBinInput = z.infer<typeof createBinSchema>;



