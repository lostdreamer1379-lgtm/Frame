import { PrismaClient } from '../../generated/prisma';
import { env, isDev } from './env';

export function isDatabaseConfigured(): boolean {
  return !!env.DATABASE_URL;
}

// Prevent multiple PrismaClient instances during dev hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient | null = null;

/**
 * Lazily-constructed Prisma client. Throws a clear error if DATABASE_URL
 * isn't set — callers should check isDatabaseConfigured() first and return
 * a 503 rather than let this throw mid-request.
 */
export function getPrisma(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new Error('Database is not configured — set DATABASE_URL');
  }

  if (isDev) {
    if (!global.__prisma) {
      global.__prisma = new PrismaClient({
        log: ['warn', 'error'],
      });
    }
    return global.__prisma;
  }

  if (!prismaClient) {
    prismaClient = new PrismaClient({ log: ['error'] });
  }
  return prismaClient;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[Database] connection check failed', error);
    return false;
  }
}
