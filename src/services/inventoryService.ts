import { prisma } from '../db/prismaClient';
import { StockInInput, StockOutInput } from '../validators/stock.validator';

export async function getStockRecords(params: { companyId: string; skuId?: string; storeId?: string }) {
  const { companyId, skuId, storeId } = params;
  return prisma.stockRecord.findMany({
    where: {
      companyId,
      skuId: skuId || undefined,
      storeId: storeId || undefined,
    },
    include: { bin: true },
    orderBy: [{ skuId: 'asc' }, { storeId: 'asc' }],
  });
}

export async function stockIn(input: StockInInput, adjustedBy: string = 'system') {
  const { companyId, storeId, skuId, binId, qty, source } = input;
  if (qty <= 0) throw new Error('Qty must be positive');

  return prisma.$transaction(async (tx) => {
    // Find existing stock record for this combination
    let record = await tx.stockRecord.findFirst({
      where: { companyId, storeId, skuId, binId: binId || undefined },
    });

    if (!record) {
      record = await tx.stockRecord.create({
        data: { companyId, storeId, skuId, binId: binId || null, onHand: 0 },
      });
    }

    const qtyBefore = record.onHand;
    const qtyAfter = qtyBefore + qty;

    const updated = await tx.stockRecord.update({
      where: { id: record.id },
      data: { onHand: qtyAfter },
    });

    if (binId) {
      await tx.bin.update({
        where: { id: binId },
        data: { currentQty: { increment: qty } },
      });
    }

    await tx.inventoryAdjustment.create({
      data: {
        companyId,
        skuId,
        storeId,
        binId: binId || null,
        qtyBefore,
        qtyAfter,
        delta: qty,
        reason: `stock_in:${source}`,
        adjustedBy,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: 'StockRecord',
        entityId: updated.id,
        action: 'stock_in',
        payload: input as unknown as object,
        userId: adjustedBy,
      },
    });

    return updated;
  });
}

export async function stockOut(input: StockOutInput, adjustedBy: string = 'system') {
  const { companyId, storeId, skuId, binId, qty, reason } = input;
  if (qty <= 0) throw new Error('Qty must be positive');

  return prisma.$transaction(async (tx) => {
    // Find stock record
    const record = await tx.stockRecord.findFirst({
      where: { companyId, storeId, skuId, binId: binId || undefined },
    });

    if (!record) {
      throw new Error('Stock record not found');
    }

    if (record.onHand < qty) {
      throw new Error('Insufficient on-hand quantity');
    }

    if (binId) {
      const bin = await tx.bin.findUnique({ where: { id: binId } });
      if (!bin) throw new Error('Bin not found');
      if ((bin.currentQty ?? 0) < qty) throw new Error('Insufficient bin quantity');
    }

    const qtyBefore = record.onHand;
    const qtyAfter = qtyBefore - qty;

    const updated = await tx.stockRecord.update({
      where: { id: record.id },
      data: { onHand: qtyAfter },
    });

    if (binId) {
      await tx.bin.update({ where: { id: binId }, data: { currentQty: { decrement: qty } } });
    }

    await tx.inventoryAdjustment.create({
      data: {
        companyId,
        skuId,
        storeId,
        binId: binId || null,
        qtyBefore,
        qtyAfter,
        delta: -qty,
        reason: `stock_out:${reason}`,
        adjustedBy,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: 'StockRecord',
        entityId: updated.id,
        action: 'stock_out',
        payload: input as unknown as object,
        userId: adjustedBy,
      },
    });

    return updated;
  });
}
