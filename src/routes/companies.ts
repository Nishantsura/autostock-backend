import { Router, Response } from 'express';
import { z } from 'zod';
import { createCompanySchema } from '../validators/company.validator';
import { sendValidationError } from '../utils/http';
import { createCompany, getCompany } from '../services/companyService';
import rateLimit from 'express-rate-limit';
import { verifyCaptcha } from '../utils/captcha';
import { requireAuth } from '../auth/middleware';
import { RequestWithUser } from '../types';

export const companiesRouter = Router();

const createCompanyLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 50),
  standardHeaders: true,
  legacyHeaders: false,
});

companiesRouter.post('/', createCompanyLimiter, requireAuth(true), async (req: RequestWithUser, res: Response) => {
  // Optional CAPTCHA: expect token in header 'x-captcha-token' or body.captchaToken
  const captchaToken = (req.headers['x-captcha-token'] as string | undefined) || (req.body?.captchaToken as string | undefined);
  const ok = await verifyCaptcha(captchaToken);
  if (!ok) return res.status(400).json({ error: { code: 'CAPTCHA_FAILED', message: 'Captcha verification failed' } });
  const parsed = createCompanySchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const company = await createCompany(parsed.data);
  return res.status(201).json({ id: company.id, name: company.name, domain: company.domain });
});

companiesRouter.get('/:companyId', requireAuth(), async (req: RequestWithUser, res: Response) => {
  const paramsSchema = z.object({ companyId: z.string().uuid() });
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid companyId', details: parsed.error.flatten?.() } });
  const company = await getCompany(parsed.data.companyId);
  if (!company) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Company not found' } });
  return res.status(200).json({
    id: company.id,
    name: company.name,
    domain: company.domain,
    taxRegistration: company.taxRegistration,
    defaultValuationMethod: company.defaultValuationMethod,
  });
});
