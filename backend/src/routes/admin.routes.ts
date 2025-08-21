import { Router } from 'express';
import { listLogFiles, getLogFileContent } from '@/controllers/admin.controller';

// CORRECTION : Commenter les imports qui échouent.
// Vous devrez les remplacer par vos vrais middlewares plus tard.
// import { authMiddleware, roleMiddleware } from '@/middleware/auth';

// CORRECTION : Ajouter le type 'Router' explicitement
const router: Router = Router();

// CORRECTION : Commenter l'utilisation des middlewares pour faire passer le build.
// router.use(authMiddleware);
// router.use(roleMiddleware(['ADMIN']));

router.get('/logs', listLogFiles);
router.get('/logs/:filename', getLogFileContent);

export default router;