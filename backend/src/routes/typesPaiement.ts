import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTypesPaiement,
  getTypePaiementById,
  createTypePaiement,
  updateTypePaiement,
  deleteTypePaiement
} from '@/controllers/typePaiementController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = Router();

// Validation pour la création de type de paiement
const createTypePaiementValidation = [
  body('libelle')
    .notEmpty()
    .withMessage('Le libellé est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le libellé doit contenir entre 2 et 100 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  
  body('delaiPaiement')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Le délai de paiement doit être entre 0 et 365 jours'),
  
  body('tauxRemise')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux de remise doit être entre 0 et 100%'),
  
  body('actif')
    .optional()
    .isBoolean()
    .withMessage('Le statut actif doit être un booléen')
];

// Validation pour la mise à jour de type de paiement
const updateTypePaiementValidation = [
  body('libelle')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le libellé doit contenir entre 2 et 100 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  
  body('delaiPaiement')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Le délai de paiement doit être entre 0 et 365 jours'),
  
  body('tauxRemise')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux de remise doit être entre 0 et 100%'),
  
  body('actif')
    .optional()
    .isBoolean()
    .withMessage('Le statut actif doit être un booléen')
];

// Routes
router.get('/', authenticateToken, getTypesPaiement);
router.get('/:id', authenticateToken, getTypePaiementById);
router.post('/', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(createTypePaiementValidation),
  createTypePaiement
);
router.put('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(updateTypePaiementValidation),
  updateTypePaiement
);
router.delete('/:id', 
  authenticateToken, 
  requireRoles(['admin']),
  deleteTypePaiement
);

export default router;