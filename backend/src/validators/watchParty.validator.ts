import { z } from 'zod';

export const partyCodeParamSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{6,12}$/, 'Invalid party code'),
});

export const createPartySchema = z.object({
  tmdbMovieId: z.coerce.number().int().positive(),
});

export const joinPartySchema = z.object({
  displayName: z.string().trim().min(1).max(40),
});

export const updatePartyStateSchema = z.object({
  currentPosition: z.coerce.number().min(0).max(100000),
  isPlaying: z.boolean(),
});
