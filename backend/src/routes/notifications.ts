import { Router } from 'express';
import { body } from 'express-validator';
import {
  getNotifications,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification
} from '@/controllers/notificationController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router: Router = Router();

// Validation pour la création de notification
const createNotificationValidation = [
  body('userId')
    .notEmpty()
    .withMessage('L\'ID de l\'utilisateur est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif'),
  
  body('type')
    .notEmpty()
    .withMessage('Le type de notification est requis')
    .isIn(['info', 'success', 'warning', 'error'])
    .withMessage('Le type doit être "info", "success", "warning" ou "error"'),
  
  body('message')
    .notEmpty()
    .withMessage('Le message est requis')
    .isLength({ min: 1, max: 500 })
    .withMessage('Le message doit contenir entre 1 et 500 caractères'),
  
  body('data')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Les données ne peuvent pas dépasser 2000 caractères')
];

// Validation pour la mise à jour des préférences
const updatePreferencesValidation = [
  body('checkUnusualActivity')
    .optional()
    .isBoolean()
    .withMessage('checkUnusualActivity doit être un booléen'),
  
  body('checkNewSignIn')
    .optional()
    .isBoolean()
    .withMessage('checkNewSignIn doit être un booléen'),
  
  body('notifyLatestNews')
    .optional()
    .isBoolean()
    .withMessage('notifyLatestNews doit être un booléen'),
  
  body('notifyFeatureUpdate')
    .optional()
    .isBoolean()
    .withMessage('notifyFeatureUpdate doit être un booléen'),
  
  body('notifyAccountTips')
    .optional()
    .isBoolean()
    .withMessage('notifyAccountTips doit être un booléen')
];

// Routes
router.get('/', authenticateToken, getNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.get('/preferences', authenticateToken, getPreferences);
router.put('/preferences', 
  authenticateToken,
  validate(updatePreferencesValidation),
  updatePreferences
);
router.patch('/:id/read', authenticateToken, markAsRead);
router.patch('/mark-all-read', authenticateToken, markAllAsRead);
router.post('/', 
  authenticateToken, 
  requireRoles(['admin']),
  validate(createNotificationValidation),
  createNotification
);
router.delete('/:id', authenticateToken, deleteNotification);

export default router;