import { Router } from 'express';
import { getGroupMessages, sendGroupMessage } from '@/controllers/groupMessageController';
import { authenticateToken } from '@/middleware/auth';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

// Récupérer les messages du groupe
router.get('/:groupeId', authenticateToken, getGroupMessages);

// Envoyer un message au groupe (avec fichiers)
router.post('/:groupeId', authenticateToken, upload.array('files'), sendGroupMessage);

export default router;
