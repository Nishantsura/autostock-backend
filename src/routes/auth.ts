import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { signJwt } from '../auth/strategies';
import { sendValidationError } from '../utils/http';
import { config } from '../config';
import { prisma } from '../db/prismaClient';

export const authRouter = Router();

// Dev-only token issuance: accepts userId, companyId, role, email and signs a token
authRouter.post('/token', async (req: Request, res: Response) => {
  const schema = z.object({
    userId: z.string().uuid(),
    companyId: z.string().uuid(),
    role: z.string().min(1),
    email: z.string().email().optional(),
    expiresIn: z.union([z.string(), z.number()]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  if (!config.JWT_SECRET) return res.status(500).json({ error: { code: 'SERVER_CONFIG', message: 'JWT secret not configured' } });
  const expires = (parsed.data.expiresIn ?? '8h') as unknown as import('jsonwebtoken').SignOptions['expiresIn'];
  const token = signJwt(parsed.data, config.JWT_SECRET, expires);
  return res.status(200).json({ token });
});

// Temporary endpoint to get seed data UUIDs (remove in production)
authRouter.get('/seed-data', async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findFirst({ where: { domain: 'example.com' } });
    const admin = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
    
    if (!company || !admin) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'Seed data not found. Run npm run prisma:seed first.' } 
      });
    }
    
    return res.status(200).json({
      companyId: company.id,
      userId: admin.id,
      companyName: company.name,
      adminEmail: admin.email
    });
  } catch (error) {
    return res.status(500).json({ 
      error: { code: 'SERVER_ERROR', message: 'Failed to get seed data' } 
    });
  }
});