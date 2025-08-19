import { prisma } from '../db/prismaClient';

export async function createZone(input: { storeId: string; name: string }) {
  return prisma.zone.create({ data: input });
}

export async function listZones(storeId: string) {
  return prisma.zone.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
}

export async function createAisle(input: { zoneId: string; name: string }) {
  return prisma.aisle.create({ data: input });
}

export async function listAisles(zoneId: string) {
  return prisma.aisle.findMany({ where: { zoneId }, orderBy: { name: 'asc' } });
}

export async function createRack(input: { aisleId: string; name: string; rows?: number | null }) {
  return prisma.rack.create({ data: { ...input, rows: input.rows ?? null } });
}

export async function listRacks(aisleId: string) {
  return prisma.rack.findMany({ where: { aisleId }, orderBy: { name: 'asc' } });
}

export async function createShelf(input: { rackId: string; level: number }) {
  return prisma.shelf.create({ data: input });
}

export async function listShelves(rackId: string) {
  return prisma.shelf.findMany({ where: { rackId }, orderBy: { level: 'asc' } });
}

export async function createBin(input: {
  shelfId: string;
  code: string;
  barcode?: string | null;
  maxQtyUnits?: number | null;
  maxVolumeM3?: number | null;
  maxWeightKg?: number | null;
  temperatureCtrl?: boolean | null;
  allowedProductTags?: string[] | null;
}) {
  return prisma.bin.create({
    data: {
      shelfId: input.shelfId,
      code: input.code,
      barcode: input.barcode ?? null,
      maxQtyUnits: input.maxQtyUnits ?? null,
      maxVolumeM3: input.maxVolumeM3 ?? null,
      maxWeightKg: input.maxWeightKg ?? null,
      temperatureCtrl: input.temperatureCtrl ?? false,
      allowedProductTags: input.allowedProductTags ?? [],
    },
  });
}

export async function listBins(shelfId: string) {
  return prisma.bin.findMany({ where: { shelfId }, orderBy: { code: 'asc' } });
}



