import { getPrisma } from '../config/prisma';
import { profileService } from './profile.service';
import { AppError } from '../middleware/errorHandlers';
import { toApiStatus, toPrismaStatus, type ApiWatchlistStatus } from '../validators/watchlist.validator';

/** Prisma's "unique constraint violated" error code. */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

function isUniqueConstraintViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === UNIQUE_CONSTRAINT_VIOLATION;
}

function serialize(entry: {
  id: string; userId: string; tmdbMovieId: number; status: string;
  addedAt: Date; updatedAt: Date;
}) {
  return {
    id: entry.id,
    userId: entry.userId,
    tmdbMovieId: entry.tmdbMovieId,
    status: toApiStatus(entry.status),
    addedAt: entry.addedAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export const watchlistService = {
  /** Lists all watchlist entries for a user, optionally filtered by status. */
  async list(authUserId: string, status?: ApiWatchlistStatus) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);

    const entries = await prisma.watchlistEntry.findMany({
      where: {
        userId: profile.id,
        ...(status ? { status: toPrismaStatus(status) as never } : {}),
      },
      orderBy: { addedAt: 'desc' },
    });

    return entries.map(serialize);
  },

  /** Adds a movie to the watchlist, or returns the existing entry if already present. */
  async add(authUserId: string, tmdbMovieId: number, status: ApiWatchlistStatus) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);

    const existing = await prisma.watchlistEntry.findUnique({
      where: { userId_tmdbMovieId: { userId: profile.id, tmdbMovieId } },
    });
    if (existing) return serialize(existing);

    try {
      const entry = await prisma.watchlistEntry.create({
        data: {
          userId: profile.id,
          tmdbMovieId,
          status: toPrismaStatus(status) as never,
        },
      });
      return serialize(entry);
    } catch (err) {
      // A second request for the same movie could have won the race between
      // our findUnique above and this create (e.g. a rapid double-click).
      // Rather than surface a 500 for what the user experiences as a no-op,
      // fetch and return the row the other request just created.
      if (isUniqueConstraintViolation(err)) {
        const winner = await prisma.watchlistEntry.findUnique({
          where: { userId_tmdbMovieId: { userId: profile.id, tmdbMovieId } },
        });
        if (winner) return serialize(winner);
      }
      throw err;
    }
  },

  /** Updates the status of an existing entry — verifies ownership first. */
  async updateStatus(authUserId: string, entryId: string, status: ApiWatchlistStatus) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);

    const existing = await prisma.watchlistEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== profile.id) {
      throw new AppError(404, 'Watchlist entry not found');
    }

    const entry = await prisma.watchlistEntry.update({
      where: { id: entryId },
      data: { status: toPrismaStatus(status) as never },
    });
    return serialize(entry);
  },

  /** Removes an entry — verifies ownership first. */
  async remove(authUserId: string, entryId: string) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);

    const existing = await prisma.watchlistEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== profile.id) {
      throw new AppError(404, 'Watchlist entry not found');
    }

    await prisma.watchlistEntry.delete({ where: { id: entryId } });
  },
};
