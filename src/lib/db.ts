import { PrismaClient } from '@prisma/client';

declare global {
  var __savemiPrisma__: PrismaClient | undefined;
}

export const prisma = globalThis.__savemiPrisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__savemiPrisma__ = prisma;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
