import { Router } from 'express';
import { body } from 'express-validator';
import {
  getSpecialites,
  getSpecialiteById,
  createSpecialite,
  updateSpecialite,
  deleteSpecialite
} from '@/controllers/specialiteController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router: Router = Router();

// Validation pour la création de spécialité
const createSpecialiteValidation = [
  body('libelle')
    .notEmpty()
    .withMessage('Le libellé est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le libellé doit contenir entre 2 et 100 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères')
];

// Validation pour la mise à jour de spécialité
const updateSpecialiteValidation = [
  body('libelle')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le libellé doit contenir entre 2 et 100 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères')
];

// Routes
router.get('/', authenticateToken, getSpecialites);
router.get('/:id', authenticateToken, getSpecialiteById);
router.post('/', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(createSpecialiteValidation),
  createSpecialite
);
router.put('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(updateSpecialiteValidation),
  updateSpecialite
);
router.delete('/:id', 
  authenticateToken, 
  requireRoles(['admin']),
  deleteSpecialite
);

export default router;