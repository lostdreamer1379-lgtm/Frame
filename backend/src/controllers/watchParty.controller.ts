import { Response, NextFunction } from 'express';
import { watchPartyService } from '../services/watchParty.service';
import { AppError } from '../middleware/errorHandlers';
import type { AuthenticatedRequest } from '../middleware/auth';
import { createPartySchema, joinPartySchema, partyCodeParamSchema, updatePartyStateSchema, partyMessageSchema } from '../validators/watchParty.validator';

export const watchPartyController = {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError(401, 'Authentication required');
      const { tmdbMovieId } = createPartySchema.parse(req.body);
      res.status(201).json(await watchPartyService.create(req.userId, tmdbMovieId));
    } catch (err) { next(err); }
  },

  async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code } = partyCodeParamSchema.parse(req.params);
      res.json(await watchPartyService.get(code, req.userId));
    } catch (err) { next(err); }
  },

  async join(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code } = partyCodeParamSchema.parse(req.params);
      const { displayName } = joinPartySchema.parse(req.body);
      res.status(201).json(await watchPartyService.join(code, displayName));
    } catch (err) { next(err); }
  },

  async updateState(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError(401, 'Authentication required');
      const { code } = partyCodeParamSchema.parse(req.params);
      const { currentPosition, isPlaying } = updatePartyStateSchema.parse(req.body);
      res.json(await watchPartyService.updateState(req.userId, code, currentPosition, isPlaying));
    } catch (err) { next(err); }
  },

  async message(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code } = partyCodeParamSchema.parse(req.params);
      const { participantId, text } = partyMessageSchema.parse(req.body);
      res.status(201).json(await watchPartyService.sendMessage(code, participantId, text));
    } catch (err) { next(err); }
  },
};
