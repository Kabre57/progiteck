// Fichier : /var/www/progiteck/backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { listLogFiles, getLogFileContent } from '@/controllers/admin.controller';
import { authMiddleware, roleMiddleware } from '@/middleware/auth'; // IMPORTANT: Sécurisez ces routes !

const router = Router();

// Appliquer les middlewares pour s'assurer que seul un admin peut voir les logs
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/logs', listLogFiles);
router.get('/logs/:filename', getLogFileContent);

export default router;
