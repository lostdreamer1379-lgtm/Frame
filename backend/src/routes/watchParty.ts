import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { requireBackingServices } from '../middleware/requireBackingServices';
import { watchPartyController } from '../controllers/watchParty.controller';

export const watchPartyRouter = Router();

watchPartyRouter.use(requireBackingServices);
watchPartyRouter.post('/', requireAuth, watchPartyController.create);
watchPartyRouter.get('/:code', optionalAuth, watchPartyController.get);
watchPartyRouter.post('/:code/join', watchPartyController.join);
watchPartyRouter.post('/:code/messages', watchPartyController.message);
watchPartyRouter.put('/:code/state', requireAuth, watchPartyController.updateState);
