import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { createSkuSchema } from '../validators/sku.validator';
import { sendValidationError } from '../utils/http';
import { createSku, getSku } from '../services/skuService';

export const skusRouter = Router();

skusRouter.post('/', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createSkuSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const sku = await createSku(parsed.data);
  return res.status(201).json({ skuId: sku.id });
});

skusRouter.get('/:skuId', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ skuId: z.string().uuid() });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid skuId', details: parsed.error.flatten?.() } });
  const sku = await getSku(parsed.data.skuId);
  if (!sku) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'SKU not found' } });
  return res.status(200).json(sku);
});
