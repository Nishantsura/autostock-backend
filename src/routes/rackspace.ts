import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import {
  createZoneSchema,
  createAisleSchema,
  createRackSchema,
  createShelfSchema,
  createBinSchema,
} from '../validators/rackspace.validator';
import { sendValidationError } from '../utils/http';
import {
  createZone,
  listZones,
  createAisle,
  listAisles,
  createRack,
  listRacks,
  createShelf,
  listShelves,
  createBin,
  listBins,
} from '../services/rackspaceService';

export const rackspaceRouter = Router();

// Zones
rackspaceRouter.post('/zones', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createZoneSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const zone = await createZone(parsed.data);
  return res.status(201).json(zone);
});

rackspaceRouter.get('/zones', requireAuth(), async (req: Request, res: Response) => {
  const query = z.object({ storeId: z.string().uuid() }).safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid storeId', details: query.error.flatten?.() } });
  const items = await listZones(query.data.storeId);
  return res.status(200).json({ items });
});

// Aisles
rackspaceRouter.post('/aisles', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createAisleSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const aisle = await createAisle(parsed.data);
  return res.status(201).json(aisle);
});

rackspaceRouter.get('/aisles', requireAuth(), async (req: Request, res: Response) => {
  const query = z.object({ zoneId: z.string().uuid() }).safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid zoneId', details: query.error.flatten?.() } });
  const items = await listAisles(query.data.zoneId);
  return res.status(200).json({ items });
});

// Racks
rackspaceRouter.post('/racks', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createRackSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const rack = await createRack(parsed.data);
  return res.status(201).json(rack);
});

rackspaceRouter.get('/racks', requireAuth(), async (req: Request, res: Response) => {
  const query = z.object({ aisleId: z.string().uuid() }).safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid aisleId', details: query.error.flatten?.() } });
  const items = await listRacks(query.data.aisleId);
  return res.status(200).json({ items });
});

// Shelves
rackspaceRouter.post('/shelves', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createShelfSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const shelf = await createShelf(parsed.data);
  return res.status(201).json(shelf);
});

rackspaceRouter.get('/shelves', requireAuth(), async (req: Request, res: Response) => {
  const query = z.object({ rackId: z.string().uuid() }).safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid rackId', details: query.error.flatten?.() } });
  const items = await listShelves(query.data.rackId);
  return res.status(200).json({ items });
});

// Bins
rackspaceRouter.post('/bins', requireAuth(), async (req: Request, res: Response) => {
  const parsed = createBinSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const bin = await createBin(parsed.data);
  return res.status(201).json(bin);
});

rackspaceRouter.get('/bins', requireAuth(), async (req: Request, res: Response) => {
  const query = z.object({ shelfId: z.string().uuid() }).safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid shelfId', details: query.error.flatten?.() } });
  const items = await listBins(query.data.shelfId);
  return res.status(200).json({ items });
});


