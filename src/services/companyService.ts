import { prisma } from '../db/prismaClient';
import { CreateCompanyInput } from '../validators/company.validator';

export async function createCompany(input: CreateCompanyInput) {
  return prisma.company.create({ data: input });
}

export async function getCompany(companyId: string) {
  return prisma.company.findUnique({ where: { id: companyId } });
}
