import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { createProductSchema } from '../validators/product.validator';
import { sendValidationError } from '../utils/http';
import { createProduct, listProducts, getProduct, updateProduct } from '../services/productService';

export const productsRouter = Router();

productsRouter.post('/', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const product = await createProduct(parsed.data);
  return res.status(201).json({ productId: product.id });
});

productsRouter.get('/', requireAuth(), async (req: Request, res: Response) => {
  const querySchema = z.object({
    companyId: z.string().uuid(),
    q: z.string().optional(),
    category: z.string().uuid().optional(),
  });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid query params');
  const products = await listProducts({
    companyId: parsed.data.companyId,
    q: parsed.data.q,
    categoryId: parsed.data.category,
  });
  return res.status(200).json({ items: products });
});

productsRouter.get('/:id', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ id: z.string().uuid() });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid id', details: parsed.error.flatten?.() } });
  const product = await getProduct(parsed.data.id);
  if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  return res.status(200).json(product);
});

productsRouter.put('/:id', requireAuth(), async (req: Request, res: Response) => {
  const paramsSchema = z.object({ id: z.string().uuid() });
  const params = paramsSchema.safeParse(req.params);
  const body = createProductSchema.partial().safeParse(req.body);
  if (!params.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid params', details: params.error.flatten?.() } });
  if (!body.success) return sendValidationError(res, body.error, 'Invalid payload');
  try {
    const product = await updateProduct(params.data.id, body.data);
    return res.status(200).json(product);
  } catch (e) {
    return res.status(400).json({ error: { code: 'UPDATE_FAILED', message: e instanceof Error ? e.message : String(e) } });
  }
});
