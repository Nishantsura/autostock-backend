import { prisma } from '../db/prismaClient';
import { CreateProductInput } from '../validators/product.validator';

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export async function listProducts(params: { companyId: string; q?: string; categoryId?: string }) {
  const { companyId, q, categoryId } = params;
  return prisma.product.findMany({
    where: {
      companyId,
      categoryId: categoryId || undefined,
      OR: q
        ? [
            { title: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ]
        : undefined,
    },
    include: { skus: true },
    orderBy: { title: 'asc' },
  });
}

export async function getProduct(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: { 
      skus: true, 
      category: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } }
    },
  });
}

export async function updateProduct(productId: string, input: Partial<CreateProductInput>) {
  return prisma.product.update({
    where: { id: productId },
    data: input,
    include: { 
      skus: true, 
      category: { select: { id: true, name: true } }
    },
  });
}
