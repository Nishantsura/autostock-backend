import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/middleware';
import { auditLogsQuerySchema } from '../validators/audit.validator';
import { sendValidationError } from '../utils/http';
import { prisma } from '../db/prismaClient';

export const auditRouter = Router();

auditRouter.get('/audit-logs', requireAuth(), async (req: Request, res: Response) => {
  const parsed = auditLogsQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid query');
  const { companyId, entity, entityId } = parsed.data;
  const items = await prisma.auditLog.findMany({
    where: {
      entity: entity || undefined,
      entityId: entityId || undefined,
      // companyId field is not on AuditLog in schema; keeping filter off. If needed, we can augment payload filter later.
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return res.status(200).json({ items });
});
