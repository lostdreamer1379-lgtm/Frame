import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { isTMDBConfigured } from '../services/tmdb.service';
import { isSupabaseConfigured } from '../config/supabase';
import { checkDatabaseConnection } from '../config/prisma';
import { tmdbCache } from '../utils/cache';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const database = await checkDatabaseConnection();
  res.json({
    status: database ? 'ok' : 'degraded',
    service: 'FRAME API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    integrations: {
      tmdb:     isTMDBConfigured(),
      supabase: isSupabaseConfigured(),
      database,
    },
    cache: {
      entries: tmdbCache.size,
    },
  });
});
