import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { createStoreSchema } from '../validators/store.validator';
import { sendValidationError } from '../utils/http';
import { createStore, listStores, getStore, updateStore } from '../services/storeService';

export const storesRouter = Router();

storesRouter.post('/', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createStoreSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const store = await createStore(parsed.data);
  return res.status(201).json({ id: store.id, name: store.name });
});

storesRouter.get('/', requireAuth(), async (req: Request, res: Response) => {
  const querySchema = z.object({ companyId: z.string().uuid() });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid companyId', details: parsed.error.flatten?.() } });
  const items = await listStores(parsed.data.companyId);
  return res.status(200).json({ items });
});

storesRouter.get('/:storeId', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ storeId: z.string().uuid() });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid storeId', details: parsed.error.flatten?.() } });
  const store = await getStore(parsed.data.storeId);
  if (!store) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Store not found' } });
  return res.status(200).json(store);
});

storesRouter.put('/:storeId', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ storeId: z.string().uuid() });
  const params = paramsSchema.safeParse(req.params);
  const body = createStoreSchema.partial().safeParse(req.body);
  if (!params.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid params', details: params.error.flatten?.() } });
  if (!body.success) return sendValidationError(res, body.error, 'Invalid payload');
  try {
    const store = await updateStore(params.data.storeId, body.data);
    return res.status(200).json(store);
  } catch (e) {
    return res.status(400).json({ error: { code: 'UPDATE_FAILED', message: e instanceof Error ? e.message : String(e) } });
  }
});
