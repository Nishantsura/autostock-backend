import { prisma } from '../db/prismaClient';
import { CreateSkuInput } from '../validators/sku.validator';

export async function createSku(input: CreateSkuInput) {
  return prisma.sKU.create({ data: input });
}

export async function getSku(skuId: string) {
  return prisma.sKU.findUnique({ where: { id: skuId }, include: { product: true } });
}
