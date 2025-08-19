import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { createUserSchema } from '../validators/user.validator';
import { sendValidationError } from '../utils/http';
import { createUser, getUser } from '../services/userService';
import { RequestWithUser } from '../types';

export const usersRouter = Router();

usersRouter.post('/', requireAuth(), async (req: RequestWithUser, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const user = await createUser(parsed.data);
  return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

usersRouter.get('/:userId', requireAuth(), async (req: RequestWithUser, res: Response) => {
  const paramsSchema = z.object({ userId: z.string().uuid() });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid userId', details: parsed.error.flatten?.() } });
  const user = await getUser(parsed.data.userId);
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  return res.status(200).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
