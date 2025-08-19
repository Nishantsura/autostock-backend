import { prisma } from '../db/prismaClient';
import { CreateUserInput } from '../validators/user.validator';

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({ data: input });
}

export async function getUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}
