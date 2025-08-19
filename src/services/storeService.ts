import { prisma } from '../db/prismaClient';
import { CreateStoreInput } from '../validators/store.validator';

export async function createStore(input: CreateStoreInput) {
  return prisma.store.create({ data: input });
}

export async function listStores(companyId: string) {
  return prisma.store.findMany({ where: { companyId }, orderBy: { name: 'asc' }, include: { zones: true } });
}

export async function getStore(storeId: string) {
  return prisma.store.findUnique({ where: { id: storeId }, include: { zones: true } });
}

export async function updateStore(storeId: string, input: Partial<CreateStoreInput>) {
  return prisma.store.update({
    where: { id: storeId },
    data: input,
    include: { zones: true },
  });
}
