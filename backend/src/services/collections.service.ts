import { getPrisma } from '../config/prisma';
import { profileService } from './profile.service';
import { AppError } from '../middleware/errorHandlers';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

function isUniqueConstraintViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === UNIQUE_CONSTRAINT_VIOLATION;
}

function serializeCollection(c: {
  id: string; userId: string; name: string; description: string | null;
  createdAt: Date; updatedAt: Date;
  movies?: { id: string; tmdbMovieId: number; position: number; addedAt: Date }[];
}) {
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    description: c.description,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    movieCount: c.movies?.length,
    movies: c.movies?.map((m) => ({
      id: m.id,
      tmdbMovieId: m.tmdbMovieId,
      position: m.position,
      addedAt: m.addedAt.toISOString(),
    })),
  };
}

/** Verifies the collection exists and belongs to the given profile; returns it or throws 404. */
async function findOwnedCollection(prisma: ReturnType<typeof getPrisma>, profileId: string, collectionId: string) {
  const collection = await prisma.movieCollection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.userId !== profileId) {
    throw new AppError(404, 'Collection not found');
  }
  return collection;
}

export const collectionsService = {
  async list(authUserId: string) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);

    const collections = await prisma.movieCollection.findMany({
      where: { userId: profile.id },
      include: { movies: { orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return collections.map(serializeCollection);
  },

  async get(authUserId: string, collectionId: string) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);

    const collection = await prisma.movieCollection.findUnique({
      where: { id: collectionId },
      include: { movies: { orderBy: { position: 'asc' } } },
    });
    if (!collection || collection.userId !== profile.id) {
      throw new AppError(404, 'Collection not found');
    }
    return serializeCollection(collection);
  },

  async create(authUserId: string, name: string, description?: string) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);

    const collection = await prisma.movieCollection.create({
      data: { userId: profile.id, name, description: description ?? null },
      include: { movies: true },
    });
    return serializeCollection(collection);
  },

  async update(authUserId: string, collectionId: string, input: { name?: string; description?: string | null }) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);
    await findOwnedCollection(prisma, profile.id, collectionId);

    const collection = await prisma.movieCollection.update({
      where: { id: collectionId },
      data: input,
      include: { movies: { orderBy: { position: 'asc' } } },
    });
    return serializeCollection(collection);
  },

  async remove(authUserId: string, collectionId: string) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);
    await findOwnedCollection(prisma, profile.id, collectionId);

    await prisma.movieCollection.delete({ where: { id: collectionId } });
  },

  async addMovie(authUserId: string, collectionId: string, tmdbMovieId: number) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);
    await findOwnedCollection(prisma, profile.id, collectionId);

    const existing = await prisma.collectionMovie.findUnique({
      where: { collectionId_tmdbMovieId: { collectionId, tmdbMovieId } },
    });
    if (existing) return collectionsService.get(authUserId, collectionId);

    const maxPosition = await prisma.collectionMovie.aggregate({
      where: { collectionId },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    try {
      await prisma.collectionMovie.create({
        data: { collectionId, tmdbMovieId, position: nextPosition },
      });
    } catch (err) {
      // Same race as watchlist.service.ts's add(): if another request added
      // this exact movie between our findUnique and this create, that's not
      // really a failure from the user's point of view — the movie is in
      // the collection either way, so just return the current state.
      const isDuplicate = isUniqueConstraintViolation(err);
      if (!isDuplicate) throw err;
    }

    return collectionsService.get(authUserId, collectionId);
  },

  async removeMovie(authUserId: string, collectionId: string, tmdbMovieId: number) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);
    await findOwnedCollection(prisma, profile.id, collectionId);

    await prisma.collectionMovie.deleteMany({ where: { collectionId, tmdbMovieId } });
    return collectionsService.get(authUserId, collectionId);
  },

  /** Re-applies position values to match the given ordered array of CollectionMovie IDs. */
  async reorderMovies(authUserId: string, collectionId: string, movieIds: string[]) {
    const prisma = getPrisma();
    const profile = await profileService.getOrCreate(authUserId);
    await findOwnedCollection(prisma, profile.id, collectionId);

    const existingMovies = await prisma.collectionMovie.findMany({ where: { collectionId } });
    const existingIds = new Set(existingMovies.map((m: { id: string }) => m.id));
    const providedIds = new Set(movieIds);

    if (existingIds.size !== providedIds.size || [...existingIds].some((id) => !providedIds.has(id))) {
      throw new AppError(400, 'movieIds must match exactly the movies currently in this collection');
    }

    await prisma.$transaction(
      movieIds.map((movieId, index) =>
        prisma.collectionMovie.update({ where: { id: movieId }, data: { position: index } })
      )
    );

    return collectionsService.get(authUserId, collectionId);
  },
};
