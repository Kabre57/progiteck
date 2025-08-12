import { Router } from 'express';
import { body } from 'express-validator';
import {
  getFactures,
  getFactureById,
  getOverdueFactures,
  updateFacture,
  deleteFacture
} from '@/controllers/factureController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router: Router = Router();

// Validation pour la mise à jour de facture
const updateFactureValidation = [
  body('statut')
    .optional()
    .isIn(['emise', 'envoyee', 'payee', 'annulee'])
    .withMessage('Le statut doit être "emise", "envoyee", "payee" ou "annulee"'),
  
  body('datePaiement')
    .optional()
    .isISO8601()
    .withMessage('La date de paiement doit être au format ISO 8601'),
  
  body('modePaiement')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le mode de paiement doit contenir entre 2 et 50 caractères'),
  
  body('referenceTransaction')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('La référence de transaction doit contenir entre 2 et 100 caractères')
];

// Routes
router.get('/', authenticateToken, getFactures);
router.get('/overdue', authenticateToken, getOverdueFactures);
router.get('/:id', authenticateToken, getFactureById);
router.put('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'commercial']),
  validate(updateFactureValidation),
  updateFacture
);
router.delete('/:id', 
  authenticateToken, 
  requireRoles(['admin']),
  deleteFacture
);

export default router;