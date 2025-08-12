import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTechniciens,
  getTechnicienById,
  createTechnicien,
  updateTechnicien,
  deleteTechnicien
} from '@/controllers/technicienController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router: Router = Router();

// Validation pour la création de technicien
const createTechnicienValidation = [
  body('nom')
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('prenom')
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  
  body('contact')
    .notEmpty()
    .withMessage('Le contact est requis')
    .isMobilePhone('any')
    .withMessage('Le numéro de contact doit être valide'),
  
  body('specialiteId')
    .notEmpty()
    .withMessage('L\'ID de la spécialité est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID de la spécialité doit être un entier positif'),
  
  body('utilisateurId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif')
];

// Validation pour la mise à jour de technicien
const updateTechnicienValidation = [
  body('nom')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('prenom')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  
  body('contact')
    .optional()
    .isMobilePhone('any')
    .withMessage('Le numéro de contact doit être valide'),
  
  body('specialiteId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la spécialité doit être un entier positif'),
  
  body('utilisateurId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'utilisateur doit être un entier positif')
];

// Routes
router.get('/', authenticateToken, getTechniciens);
router.get('/:id', authenticateToken, getTechnicienById);
router.post('/', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(createTechnicienValidation),
  createTechnicien
);
router.put('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(updateTechnicienValidation),
  updateTechnicien
);
router.delete('/:id', 
  authenticateToken, 
  requireRoles(['admin']),
  deleteTechnicien
);

export default router;