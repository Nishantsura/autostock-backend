import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { createPOSchema, receivePOSchema } from '../validators/purchaseOrder.validator';
import { sendValidationError } from '../utils/http';
import { createPurchaseOrder, listPurchaseOrders, getPurchaseOrder, receivePurchaseOrder, updatePurchaseOrder } from '../services/purchaseOrderService';

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get('/', requireAuth(), async (req: Request, res: Response) => {
  const querySchema = z.object({ companyId: z.string().uuid() });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid companyId', details: parsed.error.flatten?.() } });
  const items = await listPurchaseOrders(parsed.data.companyId);
  return res.status(200).json({ items });
});

purchaseOrdersRouter.post('/', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createPOSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const po = await createPurchaseOrder(parsed.data);
  return res.status(201).json({ id: po.id, status: po.status });
});

purchaseOrdersRouter.get('/:id', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ id: z.string().uuid() });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid id', details: parsed.error.flatten?.() } });
  const po = await getPurchaseOrder(parsed.data.id);
  if (!po) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'PO not found' } });
  return res.status(200).json(po);
});

purchaseOrdersRouter.put('/:id', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ id: z.string().uuid() });
  const params = paramsSchema.safeParse(req.params);
  const body = createPOSchema.partial().safeParse(req.body);
  if (!params.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid params', details: params.error.flatten?.() } });
  if (!body.success) return sendValidationError(res, body.error, 'Invalid payload');
  try {
    const po = await updatePurchaseOrder(params.data.id, body.data);
    return res.status(200).json(po);
  } catch (e) {
    return res.status(400).json({ error: { code: 'UPDATE_FAILED', message: e instanceof Error ? e.message : String(e) } });
  }
});

purchaseOrdersRouter.post('/:id/receive', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ id: z.string().uuid() });
  const querySchema = z.object({ storeId: z.string().uuid() });
  const params = paramsSchema.safeParse(req.params);
  const query = querySchema.safeParse(req.query);
  const body = receivePOSchema.safeParse(req.body);
  if (!params.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid params', details: params.error.flatten?.() } });
  if (!query.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query', details: query.error.flatten?.() } });
  if (!body.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid body', details: body.error.flatten?.() } });
  try {
    const result = await receivePurchaseOrder(params.data.id, body.data, query.data.storeId);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(400).json({ error: { code: 'PO_RECEIVE_FAILED', message: e instanceof Error ? e.message : String(e) } });
  }
});
