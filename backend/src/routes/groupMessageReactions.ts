import { Router } from 'express';
import { updateGroupMessageReactions } from '@/controllers/groupMessageReactionsController';
import { authenticateToken } from '@/middleware/auth';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

// PATCH /api/group-messages/:messageId/reactions
router.patch('/:messageId/reactions', authenticateToken, updateGroupMessageReactions);

export default router;
