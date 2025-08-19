import { prisma } from '../db/prismaClient';
import { CreateSupplierInput } from '../validators/supplier.validator';

export async function createSupplier(input: CreateSupplierInput) {
  return prisma.supplier.create({ data: input });
}

export async function listSuppliers(companyId: string) {
  return prisma.supplier.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
}

export async function getSupplier(supplierId: string) {
  return prisma.supplier.findUnique({
    where: { id: supplierId },
    include: { 
      company: { select: { id: true, name: true } }
    },
  });
}

export async function updateSupplier(supplierId: string, input: Partial<CreateSupplierInput>) {
  return prisma.supplier.update({
    where: { id: supplierId },
    data: input,
  });
}
