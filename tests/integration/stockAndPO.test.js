const request = require('supertest');
const { createApp } = require('../../dist/app');
const { prisma } = require('../../dist/db/prismaClient');
const { signJwt } = require('../../dist/auth/strategies');

const hasDb = !!process.env.DATABASE_URL;

function authHeader(user) {
  const token = signJwt(user, process.env.JWT_SECRET, '1h');
  return { Authorization: `Bearer ${token}` };
}

(hasDb ? describe : describe.skip)('POST /api/v1/stock/in and PO receive', () => {
  let app;
  let company;
  let warehouse;
  let bin;
  let product;
  let sku;
  let supplier;
  let user;

  beforeAll(async () => {
    app = createApp();
    // Minimal deterministic seed for test
    company = await prisma.company.create({ data: { name: 'Test Co', domain: 'test.local' } });
    user = { id: '00000000-0000-0000-0000-000000000001', companyId: company.id, name: 'Tester', email: 't@test.local', role: 'admin' };
    const storeWh = await prisma.store.create({ data: { companyId: company.id, type: 'warehouse', name: 'WH' } });
    warehouse = storeWh;
    const zone = await prisma.zone.create({ data: { storeId: storeWh.id, name: 'Z' } });
    const aisle = await prisma.aisle.create({ data: { zoneId: zone.id, name: 'A' } });
    const rack = await prisma.rack.create({ data: { aisleId: aisle.id, name: 'R' } });
    const shelf = await prisma.shelf.create({ data: { rackId: rack.id, level: 1 } });
    bin = await prisma.bin.create({ data: { shelfId: shelf.id, code: 'B1' } });
    const category = await prisma.category.create({ data: { companyId: company.id, name: 'Cat' } });
    product = await prisma.product.create({ data: { companyId: company.id, title: 'P1', categoryId: category.id } });
    sku = await prisma.sKU.create({ data: { productId: product.id, skuCode: 'SKU-TEST', unitOfMeasure: 'pcs', packSize: 1 } });
    supplier = await prisma.supplier.create({ data: { companyId: company.id, name: 'Supplier' } });
  });

  afterAll(async () => {
    // Clean database — truncate relevant tables
    const tables = [
      'PurchaseReceiptLine',
      'PurchaseReceipt',
      'POLine',
      'PurchaseOrder',
      'InventoryAdjustment',
      'AuditLog',
      'StockRecord',
      'Supplier',
      'SKU',
      'Product',
      'Category',
      'Bin',
      'Shelf',
      'Rack',
      'Aisle',
      'Zone',
      'Store',
      'User',
      'Company',
    ];
    for (const t of tables) {
      try { await prisma.$executeRawUnsafe(`DELETE FROM "${t}"`); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('stock in increases onHand and creates adjustment', async () => {
    const payload = {
      companyId: company.id,
      storeId: warehouse.id,
      skuId: sku.id,
      binId: bin.id,
      qty: 5,
      source: 'manual',
    };
    const res = await request(app)
      .post('/api/v1/stock/in')
      .set(authHeader(user))
      .send(payload)
      .expect(200);

    expect(res.body.stockRecord).toBeDefined();
    expect(res.body.stockRecord.onHand).toBe(5);

    const adjustments = await prisma.inventoryAdjustment.findMany({ where: { companyId: company.id, skuId: sku.id } });
    expect(adjustments.length).toBeGreaterThan(0);
  });

  test('receive PO creates receipt and stocks in', async () => {
    // Create PO
    const poResp = await request(app)
      .post('/api/v1/purchase-orders')
      .set(authHeader(user))
      .send({
        companyId: company.id,
        supplierId: supplier.id,
        poNumber: 'PO-1',
        lines: [{ skuId: sku.id, qtyOrdered: 3, unitCost: 10 }],
      })
      .expect(201);

    const poId = poResp.body.id;
    const po = await prisma.purchaseOrder.findUnique({ where: { id: poId }, include: { lines: true } });
    const poLineId = po.lines[0].id;

    // Receive
    const recv = await request(app)
      .post(`/api/v1/purchase-orders/${poId}/receive`)
      .query({ storeId: warehouse.id })
      .set(authHeader(user))
      .send({ lines: [{ poLineId, qtyReceived: 3, binId: bin.id }] })
      .expect(200);

    expect(recv.body.receiptId).toBeDefined();
    expect(['partially_received', 'received']).toContain(recv.body.status);

    const stock = await prisma.stockRecord.findFirst({ where: { companyId: company.id, storeId: warehouse.id, skuId: sku.id, binId: bin.id } });
    expect(stock).toBeTruthy();
    expect(stock.onHand).toBeGreaterThanOrEqual(3);
  });
});


