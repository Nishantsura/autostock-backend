import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randomSkuCode(prefix: string = 'SKU'): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

async function main() {
  // Upsert a company
  const company = await prisma.company.upsert({
    where: { domain: 'example.com' },
    update: {},
    create: {
      name: 'Example Co',
      domain: 'example.com',
      defaultValuationMethod: 'FIFO',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    },
  });

  const retailStore = await prisma.store.create({
    data: {
      companyId: company.id,
      type: 'retail',
      name: 'Main Retail',
      address: '123 Market St',
    },
  });

  const warehouse = await prisma.store.create({
    data: {
      companyId: company.id,
      type: 'warehouse',
      name: 'Central Warehouse',
      address: '200 Logistics Ave',
    },
  });

  const zone = await prisma.zone.create({
    data: { storeId: warehouse.id, name: 'Zone A' },
  });
  const aisle = await prisma.aisle.create({ data: { zoneId: zone.id, name: 'Aisle 1' } });
  const rack = await prisma.rack.create({ data: { aisleId: aisle.id, name: 'Rack 1', rows: 4 } });
  const shelf = await prisma.shelf.create({ data: { rackId: rack.id, level: 1 } });
  const bin = await prisma.bin.create({ data: { shelfId: shelf.id, code: 'BIN-1' } });

  const category = await prisma.category.create({
    data: { companyId: company.id, name: 'General' },
  });

  const product = await prisma.product.create({
    data: {
      companyId: company.id,
      title: 'Widget',
      brand: 'Acme',
      categoryId: category.id,
      tags: ['demo'],
    },
  });

  const sku1 = await prisma.sKU.create({
    data: {
      productId: product.id,
      skuCode: randomSkuCode('WID'),
      unitOfMeasure: 'pcs',
      packSize: 1,
    },
  });

  const sku2 = await prisma.sKU.create({
    data: {
      productId: product.id,
      skuCode: randomSkuCode('WID'),
      unitOfMeasure: 'pcs',
      packSize: 10,
    },
  });

  // Create initial stock records (0 on hand)
  await prisma.stockRecord.createMany({
    data: [
      { companyId: company.id, storeId: warehouse.id, skuId: sku1.id, binId: bin.id },
      { companyId: company.id, storeId: warehouse.id, skuId: sku2.id, binId: bin.id },
      { companyId: company.id, storeId: retailStore.id, skuId: sku1.id },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete:', { 
    company: company.domain, 
    admin: admin.email,
    companyId: company.id,
    userId: admin.id
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
