import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDevis,
  getDevisById,
  createDevis,
  updateDevis,
  validateDevis,
  convertToInvoice,
  deleteDevis
} from '@/controllers/devisController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = Router();

// Validation pour la création de devis
const createDevisValidation = [
  body('clientId')
    .notEmpty()
    .withMessage('L\'ID du client est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du client doit être un entier positif'),
  
  body('missionId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Valeur vide acceptée
      }
      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw new Error('L\'ID de la mission doit être un entier positif');
      }
      return true;
    }),
  
  body('titre')
    .notEmpty()
    .withMessage('Le titre est requis')
    .isLength({ min: 3, max: 200 })
    .withMessage('Le titre doit contenir entre 3 et 200 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  
  body('tauxTVA')
    .notEmpty()
    .withMessage('Le taux de TVA est requis')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Le taux de TVA doit être entre 0 et 100%'),
  
  body('dateValidite')
    .notEmpty()
    .withMessage('La date de validité est requise')
    .isISO8601()
    .withMessage('La date de validité doit être au format ISO 8601'),
  
  body('lignes')
    .isArray({ min: 1 })
    .withMessage('Au moins une ligne de devis est requise'),
  
  body('lignes.*.designation')
    .notEmpty()
    .withMessage('La désignation de la ligne est requise')
    .isLength({ min: 3, max: 200 })
    .withMessage('La désignation doit contenir entre 3 et 200 caractères'),
  
  body('lignes.*.quantite')
    .notEmpty()
    .withMessage('La quantité est requise')
    .isFloat({ min: 0.01 })
    .withMessage('La quantité doit être supérieure à 0'),
  
  body('lignes.*.prixUnitaire')
    .notEmpty()
    .withMessage('Le prix unitaire est requis')
    .isFloat({ min: 0 })
    .withMessage('Le prix unitaire doit être positif')
];

// Validation pour la validation de devis
const validateDevisValidation = [
  body('statut')
    .notEmpty()
    .withMessage('Le statut est requis')
    .isIn(['valide_dg', 'refuse_dg', 'valide_pdg', 'refuse_pdg', 'accepte_client', 'refuse_client'])
    .withMessage('Statut de validation invalide'),
  
  body('commentaireDG')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Le commentaire DG ne peut pas dépasser 1000 caractères'),
  
  body('commentairePDG')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Le commentaire PDG ne peut pas dépasser 1000 caractères')
];

// Routes
router.get('/', authenticateToken, getDevis);
router.get('/:id', authenticateToken, getDevisById);
router.post('/', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'commercial']),
  validate(createDevisValidation),
  createDevis
);
router.put('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'commercial']),
  validate(createDevisValidation),
  updateDevis
);
router.patch('/:id/validate', 
  authenticateToken, 
  requireRoles(['admin']),
  validate(validateDevisValidation),
  validateDevis
);
router.post('/:id/convert-to-invoice', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  convertToInvoice
);
router.delete('/:id', 
  authenticateToken, 
  requireRoles(['admin']),
  deleteDevis
);

export default router;