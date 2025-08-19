import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/middleware';
import { config } from '../config';

export const integrationsRouter = Router();

integrationsRouter.get('/', requireAuth(), async (_req: Request, res: Response) => {
  return res.status(200).json({ items: ['shopify', 'tiktok'] });
});

integrationsRouter.post('/shopify/connect', requireAuth(), async (_req: Request, res: Response) => {
  return res.status(200).json({ redirectUrl: 'https://shopify.com/oauth/authorize?client_id=...' });
});

integrationsRouter.post('/tiktok/connect', requireAuth(), async (_req: Request, res: Response) => {
  return res.status(200).json({ redirectUrl: 'https://tiktok.com/oauth/authorize?client_id=...' });
});

integrationsRouter.post('/webhook', async (req: Request, res: Response) => {
  const token = req.headers['x-webhook-token'];
  if (!token || token !== config.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: { code: 'INVALID_WEBHOOK', message: 'Unauthorized webhook' } });
  }
  // TODO: parse and map orders to stock/out
  return res.status(200).json({ ok: true });
});
