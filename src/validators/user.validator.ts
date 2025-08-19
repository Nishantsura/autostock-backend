import { z } from 'zod';

export const createUserSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'manager']).or(z.string().min(1)),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
