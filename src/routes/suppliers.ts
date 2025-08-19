import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { createSupplierSchema } from '../validators/supplier.validator';
import { sendValidationError } from '../utils/http';
import { createSupplier, listSuppliers, getSupplier, updateSupplier } from '../services/supplierService';

export const suppliersRouter = Router();

suppliersRouter.post('/', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createSupplierSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const supplier = await createSupplier(parsed.data);
  return res.status(201).json({ id: supplier.id, name: supplier.name });
});

suppliersRouter.get('/', requireAuth(), async (req: Request, res: Response) => {
  const querySchema = z.object({ companyId: z.string().uuid() });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid companyId', details: parsed.error.flatten?.() } });
  const items = await listSuppliers(parsed.data.companyId);
  return res.status(200).json({ items });
});

suppliersRouter.get('/:id', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ id: z.string().uuid() });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid id', details: parsed.error.flatten?.() } });
  const supplier = await getSupplier(parsed.data.id);
  if (!supplier) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
  return res.status(200).json(supplier);
});

suppliersRouter.put('/:id', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ id: z.string().uuid() });
  const params = paramsSchema.safeParse(req.params);
  const body = createSupplierSchema.partial().safeParse(req.body);
  if (!params.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid params', details: params.error.flatten?.() } });
  if (!body.success) return sendValidationError(res, body.error, 'Invalid payload');
  try {
    const supplier = await updateSupplier(params.data.id, body.data);
    return res.status(200).json(supplier);
  } catch (e) {
    return res.status(400).json({ error: { code: 'UPDATE_FAILED', message: e instanceof Error ? e.message : String(e) } });
  }
});
