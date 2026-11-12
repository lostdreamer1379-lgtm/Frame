import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { env, isDev } from './config/env';
import { healthRouter } from './routes/health';
import { moviesRouter } from './routes/movies';
import { profileRouter } from './routes/profile';
import { watchlistRouter } from './routes/watchlist';
import { historyRouter } from './routes/history';
import { collectionsRouter } from './routes/collections';
import { peopleRouter } from './routes/people';
import { watchPartyRouter } from './routes/watchParty';
import { notFoundHandler, errorHandler } from './middleware/errorHandlers';
import { isTMDBConfigured } from './services/tmdb.service';

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // needed for embedded players later
}));

app.use(cors({
  origin: env.FRONTEND_URL.split(',').map((value) => value.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Optional shared API key. This is a lightweight access gate, not a secret
// when embedded in a browser app; keep user authorization in Supabase JWTs.
if (env.API_KEY) {
  app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.method === 'OPTIONS') return next();
    if (req.get('X-API-Key') !== env.API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
  });
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Global baseline for all /api routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// Tighter limit specifically on TMDB-proxying routes to protect the upstream quota
const tmdbLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many movie-data requests, please slow down.' },
});
app.use('/api/movies', tmdbLimiter);
app.use('/api/people', tmdbLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression() as express.RequestHandler);

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(isDev ? 'dev' : 'combined'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api',              healthRouter);
app.use('/api/movies',       moviesRouter);
app.use('/api/profile',      profileRouter);
app.use('/api/watchlist',    watchlistRouter);
app.use('/api/history',      historyRouter);
app.use('/api/collections',  collectionsRouter);
app.use('/api/people',       peopleRouter);
app.use('/api/watch-parties', watchPartyRouter);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT, 10);
if (process.env.VERCEL !== '1') app.listen(PORT, () => {
  const healthPath = isDev ? `http://localhost:${PORT}/api/health` : `/api/health (port ${PORT})`;
  console.log(`\n🎬 FRAME API running on port ${PORT}`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Health      : ${healthPath}`);
  console.log(`   TMDB        : ${isTMDBConfigured() ? '✓ configured' : '⚠ not configured — set TMDB_API_READ_ACCESS_TOKEN'}`);
  console.log(`   Supabase    : ${env.SUPABASE_URL ? '✓ configured' : '⚠ not configured'}\n`);
});

export default app;
