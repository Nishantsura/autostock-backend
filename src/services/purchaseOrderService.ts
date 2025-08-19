import { prisma } from '../db/prismaClient';
import { CreatePOInput, ReceivePOInput } from '../validators/purchaseOrder.validator';

export async function createPurchaseOrder(input: CreatePOInput) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({
      data: {
        companyId: input.companyId,
        supplierId: input.supplierId,
        poNumber: input.poNumber,
        status: 'created',
        expectedDelivery: input.expectedDelivery ? new Date(input.expectedDelivery) : null,
        lines: {
          create: input.lines.map((l) => ({
            skuId: l.skuId,
            qtyOrdered: l.qtyOrdered,
            unitCost: l.unitCost,
            landedCostComponents: l.landedCostComponents ?? undefined,
          })),
        },
      },
      include: { lines: true },
    });
    return po;
  });
}

export async function listPurchaseOrders(companyId: string) {
  return prisma.purchaseOrder.findMany({
    where: { companyId },
    include: { 
      lines: true, 
      supplier: { select: { id: true, name: true } },
      receipts: { include: { lines: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPurchaseOrder(poId: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { lines: true, supplier: true, company: true, receipts: { include: { lines: true } } },
  });
}

export async function updatePurchaseOrder(poId: string, input: Partial<CreatePOInput>) {
  return prisma.$transaction(async (tx) => {
    // Only allow updates if status is 'created'
    const existingPO = await tx.purchaseOrder.findUnique({ where: { id: poId } });
    if (!existingPO) throw new Error('Purchase Order not found');
    if (existingPO.status !== 'created') throw new Error('Cannot update PO that has been processed');

    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        supplierId: input.supplierId,
        poNumber: input.poNumber,
        expectedDelivery: input.expectedDelivery ? new Date(input.expectedDelivery) : undefined,
      },
      include: { lines: true, supplier: true },
    });

    // If lines are provided, replace all lines
    if (input.lines && input.lines.length > 0) {
      // Delete existing lines
      await tx.pOLine.deleteMany({ where: { purchaseOrderId: poId } });
      
      // Create new lines
      await tx.pOLine.createMany({
        data: input.lines.map((l) => ({
          purchaseOrderId: poId,
          skuId: l.skuId,
          qtyOrdered: l.qtyOrdered,
          unitCost: l.unitCost,
          landedCostComponents: l.landedCostComponents ?? undefined,
        })),
      });
    }

    return tx.purchaseOrder.findUnique({
      where: { id: poId },
      include: { lines: true, supplier: true },
    });
  });
}

export async function receivePurchaseOrder(poId: string, input: ReceivePOInput, storeId: string, adjustedBy: string = 'api') {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: poId }, include: { lines: true } });
    if (!po) throw new Error('PO not found');

    // Create receipt header first
    const receipt = await tx.purchaseReceipt.create({ data: { poId: po.id } });

    for (const line of input.lines) {
      const poLine = po.lines.find((l) => l.id === line.poLineId);
      if (!poLine) throw new Error(`PO line not found: ${line.poLineId}`);

      // Update PO line received qty
      await tx.pOLine.update({ where: { id: poLine.id }, data: { qtyReceived: { increment: line.qtyReceived } } });

      // Create receipt line
      await tx.purchaseReceiptLine.create({
        data: {
          receiptId: receipt.id,
          poLineId: poLine.id,
          skuId: poLine.skuId,
          qtyReceived: line.qtyReceived,
        },
      });

      // Stock in atomically
      const companyId = po.companyId;
      const skuId = poLine.skuId;
      const binId = line.binId ?? null;

      let record = await tx.stockRecord.findFirst({
        where: { companyId, storeId, skuId, binId: binId ?? undefined },
      });
      if (!record) {
        record = await tx.stockRecord.create({ data: { companyId, storeId, skuId, binId, onHand: 0 } });
      }

      const qtyBefore = record.onHand;
      const qtyAfter = qtyBefore + line.qtyReceived;

      const updated = await tx.stockRecord.update({ where: { id: record.id }, data: { onHand: qtyAfter } });

      if (binId) {
        await tx.bin.update({ where: { id: binId }, data: { currentQty: { increment: line.qtyReceived } } });
      }

      await tx.inventoryAdjustment.create({
        data: {
          companyId,
          skuId,
          storeId,
          binId,
          qtyBefore,
          qtyAfter,
          delta: line.qtyReceived,
          reason: 'stock_in:po',
          adjustedBy,
        },
      });

      await tx.auditLog.create({
        data: {
          entity: 'StockRecord',
          entityId: updated.id,
          action: 'stock_in',
          payload: { poId, poLineId: poLine.id, receiptId: receipt.id, qtyReceived: line.qtyReceived, binId },
          userId: adjustedBy,
        },
      });
    }

    // Update PO status
    const refreshed = await tx.purchaseOrder.findUnique({ where: { id: po.id }, include: { lines: true } });
    if (!refreshed) throw new Error('PO not found after receipt');
    const allReceived = refreshed.lines.every((l) => l.qtyReceived >= l.qtyOrdered);
    const status = allReceived ? 'received' : refreshed.lines.some((l) => l.qtyReceived > 0) ? 'partially_received' : 'created';
    await tx.purchaseOrder.update({ where: { id: po.id }, data: { status } });

    return { receiptId: receipt.id, status };
  });
}
