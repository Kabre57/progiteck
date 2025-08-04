import { Router } from 'express';
import {
  getStats,
  getCharts,
  getRecentActivity,
  getProjectsStatus,
  getKPIs
} from '@/controllers/dashboardController';
import { authenticateToken } from '@/middleware/auth';
import { logger } from '@/config/logger';

const router = Router();

// Route globale pour toutes les données du dashboard
router.get('/', authenticateToken, async (req, res) => {
  try {
    logger.info('Fetching complete dashboard data');
    
    // Créer un objet pour stocker toutes les données
    const dashboardData = {
      stats: null,
      charts: null,
      recentActivity: null,
      projectsStatus: null,
      kpis: null
    };

    // Fonction wrapper pour éviter les doubles réponses
    const handleController = async (controllerFn: Function, key: string) => {
      return new Promise((resolve) => {
        const mockRes = {
          json: (data: any) => {
            dashboardData[key] = data.data;
            resolve(data.data);
          },
          status: () => mockRes
        };

        controllerFn(req, mockRes, () => resolve(null));
      });
    };

    // Exécuter tous les contrôleurs en parallèle
    await Promise.all([
      handleController(getStats, 'stats'),
      handleController(getCharts, 'charts'),
      handleController(getRecentActivity, 'recentActivity'),
      handleController(getProjectsStatus, 'projectsStatus'),
      handleController(getKPIs, 'kpis')
    ]);

    logger.info('Successfully fetched dashboard data');
    
    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data fetched successfully'
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Routes individuelles
router.get('/stats', authenticateToken, getStats);
router.get('/charts', authenticateToken, getCharts);
router.get('/recent-activity', authenticateToken, getRecentActivity);
router.get('/projects-status', authenticateToken, getProjectsStatus);
router.get('/kpis', authenticateToken, getKPIs);

export default router;