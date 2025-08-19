const request = require('supertest');
const { createApp } = require('../../dist/app');
const { prisma } = require('../../dist/db/prismaClient');
const { signJwt } = require('../../dist/auth/strategies');

const hasDb = !!process.env.DATABASE_URL;

function authHeader(user) {
  const token = signJwt(user, process.env.JWT_SECRET, '1h');
  return { Authorization: `Bearer ${token}` };
}

(hasDb ? describe : describe.skip)('POST /api/v1/stock/out', () => {
  let app;
  let company;
  let warehouse;
  let bin;
  let product;
  let sku;
  let user;

  beforeAll(async () => {
    app = createApp();
    company = await prisma.company.create({ data: { name: 'SO Co', domain: 'so.local' } });
    user = { userId: '00000000-0000-0000-0000-000000000002', companyId: company.id, name: 'Tester', email: 't@so.local', role: 'admin' };
    const storeWh = await prisma.store.create({ data: { companyId: company.id, type: 'warehouse', name: 'WH' } });
    warehouse = storeWh;
    const zone = await prisma.zone.create({ data: { storeId: storeWh.id, name: 'Z' } });
    const aisle = await prisma.aisle.create({ data: { zoneId: zone.id, name: 'A' } });
    const rack = await prisma.rack.create({ data: { aisleId: aisle.id, name: 'R' } });
    const shelf = await prisma.shelf.create({ data: { rackId: rack.id, level: 1 } });
    bin = await prisma.bin.create({ data: { shelfId: shelf.id, code: 'B1' } });
    const category = await prisma.category.create({ data: { companyId: company.id, name: 'Cat' } });
    product = await prisma.product.create({ data: { companyId: company.id, title: 'P1', categoryId: category.id } });
    sku = await prisma.sKU.create({ data: { productId: product.id, skuCode: 'SKU-SO', unitOfMeasure: 'pcs', packSize: 1 } });

    // stock in first
    await request(app)
      .post('/api/v1/stock/in')
      .set(authHeader(user))
      .send({ companyId: company.id, storeId: warehouse.id, skuId: sku.id, binId: bin.id, qty: 10, source: 'manual' })
      .expect(200);
  });

  afterAll(async () => {
    const tables = [
      'InventoryAdjustment',
      'AuditLog',
      'StockRecord',
      'SKU',
      'Product',
      'Category',
      'Bin',
      'Shelf',
      'Rack',
      'Aisle',
      'Zone',
      'Store',
      'Company',
    ];
    for (const t of tables) {
      try { await prisma.$executeRawUnsafe(`DELETE FROM "${t}"`); } catch (_) {}
    }
    await prisma.$disconnect();
  });

  test('stock out reduces onHand and creates adjustment', async () => {
    const res = await request(app)
      .post('/api/v1/stock/out')
      .set(authHeader(user))
      .send({ companyId: company.id, storeId: warehouse.id, skuId: sku.id, binId: bin.id, qty: 4, reason: 'sale' })
      .expect(200);

    expect(res.body.stockRecord).toBeDefined();
    expect(res.body.stockRecord.onHand).toBe(6);
    const adjustments = await prisma.inventoryAdjustment.findMany({ where: { companyId: company.id, skuId: sku.id, reason: { contains: 'stock_out' } } });
    expect(adjustments.length).toBeGreaterThan(0);
  });
});



