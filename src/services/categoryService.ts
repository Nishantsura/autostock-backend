import { prisma } from '../db/prismaClient';
import { CreateCategoryInput } from '../validators/category.validator';

export async function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({ data: input });
}

export async function listCategories(companyId: string) {
  return prisma.category.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
}
