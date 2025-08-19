import { z } from 'zod';

export const auditLogsQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
});
