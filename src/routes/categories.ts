import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { createCategorySchema } from '../validators/category.validator';
import { sendValidationError } from '../utils/http';
import { createCategory, listCategories } from '../services/categoryService';

export const categoriesRouter = Router();

categoriesRouter.post('/', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const category = await createCategory(parsed.data);
  return res.status(201).json({ categoryId: category.id });
});

categoriesRouter.get('/', requireAuth(), async (req: Request, res: Response) => {
  const querySchema = z.object({ companyId: z.string().uuid() });
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid companyId', details: parsed.error.flatten?.() } });
  const items = await listCategories(parsed.data.companyId);
  return res.status(200).json({ items });
});
