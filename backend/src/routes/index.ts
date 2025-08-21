import { Router } from 'express';
import authRoutes from './auth';
import clientRoutes from './clients';
import missionRoutes from './missions';
import technicienRoutes from './techniciens';
import specialiteRoutes from './specialites';
import typePaiementRoutes from './typesPaiement';
import interventionRoutes from './interventions';
import devisRoutes from './devis';
import factureRoutes from './factures';
import stockRoutes from './stock';
import rapportRoutes from './rapports';
import messageRoutes from './messages';
import groupMessagesRoutes from './groupMessages';
import groupMessageReactionsRoutes from './groupMessageReactions';
import notificationRoutes from './notifications';
import dashboardRoutes from './dashboard';
import userRoutes from './users';
import { apiLimiter } from '@/middleware/rateLimiter';

// --- AJOUTER CET IMPORT ---
import logRoutes from './log.routes';
import adminRoutes from './admin.routes';
import permissionRoutes from './permissions';

const router: Router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: 'API Progitek System opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Info
router.get("/info", (_req, res) => {
  res.json({
    success: true,
    message: 'Progitek System API',
    version: '1.0.0',
    description: 'API REST pour le système de gestion technique Progitek',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      clients: '/api/clients',
      missions: '/api/missions',
      techniciens: '/api/techniciens',
      specialites: '/api/specialites',
      typesPaiement: '/api/types-paiement',
      interventions: '/api/interventions',
      devis: '/api/devis',
      factures: '/api/factures',
      rapports: '/api/rapports',
      messages: '/api/messages',
      notifications: '/api/notifications',
      dashboard: '/api/dashboard'
    },
    documentation: '/api-docs'
  });
});

// Routes avec rate limiting
router.use('/auth', authRoutes);
router.use('/users', apiLimiter, userRoutes);
router.use('/clients', apiLimiter, clientRoutes);
router.use('/missions', apiLimiter, missionRoutes);
router.use('/techniciens', apiLimiter, technicienRoutes);
router.use('/specialites', apiLimiter, specialiteRoutes);
router.use('/types-paiement', apiLimiter, typePaiementRoutes);
router.use('/interventions', apiLimiter, interventionRoutes);
router.use('/devis', apiLimiter, devisRoutes);
router.use('/factures', apiLimiter, factureRoutes);
router.use('/rapports', apiLimiter, rapportRoutes);
router.use('/messages', apiLimiter, messageRoutes);
router.use('/group-messages', groupMessagesRoutes);
router.use('/group-messages', groupMessageReactionsRoutes);
router.use('/notifications', apiLimiter, notificationRoutes);
router.use('/dashboard', apiLimiter, dashboardRoutes);
router.use('/stock', apiLimiter, stockRoutes);
router.use('/logs', logRoutes);
router.use('/admin', adminRoutes);
router.use('/permissions', apiLimiter, permissionRoutes);

export default router;