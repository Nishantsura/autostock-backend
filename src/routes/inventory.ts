import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/middleware';
import { stockQuerySchema, stockInSchema, stockOutSchema } from '../validators/stock.validator';
import { inventoryAdjustSchema } from '../validators/inventory.validator';
import { getStockRecords, stockIn, stockOut } from '../services/inventoryService';
import { sendValidationError } from '../utils/http';
import { prisma } from '../db/prismaClient';

export const inventoryRouter = Router();

inventoryRouter.get('/stock', requireAuth(), async (req: Request, res: Response) => {
  const parsed = stockQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid query');
  const items = await getStockRecords(parsed.data);
  return res.status(200).json({ items });
});

inventoryRouter.post('/stock/in', requireAuth(), async (req: Request, res: Response) => {
  const parsed = stockInSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  try {
    const updated = await stockIn(parsed.data, 'api');
    return res.status(200).json({ stockRecord: updated });
  } catch (e) {
    return res.status(400).json({ error: { code: 'STOCK_IN_FAILED', message: e instanceof Error ? e.message : String(e) } });
  }
});

inventoryRouter.post('/stock/out', requireAuth(), async (req: Request, res: Response) => {
  const parsed = stockOutSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  try {
    const updated = await stockOut(parsed.data, 'api');
    return res.status(200).json({ stockRecord: updated });
  } catch (e) {
    return res.status(400).json({ error: { code: 'STOCK_OUT_FAILED', message: e instanceof Error ? e.message : String(e) } });
  }
});

inventoryRouter.post('/inventory/adjust', requireAuth(), async (req: Request, res: Response) => {
  const parsed = inventoryAdjustSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error, 'Invalid payload');
  const { companyId, skuId, storeId, binId, qtyBefore, qtyAfter, reason } = parsed.data;
  const delta = qtyAfter - qtyBefore;
  try {
    const result = await prisma.$transaction(async (tx) => {
      let record = await tx.stockRecord.findFirst({ where: { companyId, storeId, skuId, binId: binId || undefined } });
      if (!record) {
        record = await tx.stockRecord.create({ data: { companyId, storeId, skuId, binId: binId || null, onHand: 0 } });
      }
      const updated = await tx.stockRecord.update({ where: { id: record.id }, data: { onHand: qtyAfter } });
      if (binId) {
        await tx.bin.update({ where: { id: binId }, data: { currentQty: qtyAfter } });
      }
      await tx.inventoryAdjustment.create({
        data: { companyId, skuId, storeId, binId: binId || null, qtyBefore, qtyAfter, delta, reason, adjustedBy: 'api' },
      });
      await tx.auditLog.create({
        data: {
          entity: 'StockRecord',
          entityId: updated.id,
          action: 'inventory_adjust',
          payload: { companyId, skuId, storeId, binId, qtyBefore, qtyAfter, reason },
          userId: 'api',
        },
      });
      return updated;
    });
    return res.status(200).json({ stockRecord: result });
  } catch (e) {
    return res.status(400).json({ error: { code: 'INVENTORY_ADJUST_FAILED', message: e instanceof Error ? e.message : String(e) } });
  }
});
