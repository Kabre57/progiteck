import { Router } from 'express';
import { body } from 'express-validator';
import {
  getRapports,
  getRapportById,
  createRapport,
  updateRapport,
  validateRapport,
  deleteRapport
} from '@/controllers/rapportController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router: Router = Router();

// Validation pour la création de rapport
const createRapportValidation = [
  body('titre')
    .notEmpty()
    .withMessage('Le titre est requis')
    .isLength({ min: 3, max: 200 })
    .withMessage('Le titre doit contenir entre 3 et 200 caractères'),
  
  body('contenu')
    .notEmpty()
    .withMessage('Le contenu est requis')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Le contenu doit contenir entre 10 et 5000 caractères'),
  
  body('interventionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'intervention doit être un entier positif'),
  
  body('technicienId')
    .notEmpty()
    .withMessage('L\'ID du technicien est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du technicien doit être un entier positif'),
  
  body('missionId')
    .notEmpty()
    .withMessage('L\'ID de la mission est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID de la mission doit être un entier positif'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Les images doivent être un tableau'),
  
  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('L\'URL de l\'image doit être valide'),
  
  body('images.*.description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La description de l\'image ne peut pas dépasser 200 caractères')
];

const updateRapportValidation = [
  body("titre")
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage("Le titre doit contenir entre 3 et 200 caractères"),
  
  body("contenu")
    .optional()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Le contenu doit contenir entre 10 et 5000 caractères"),
  
  body("images")
    .optional()
    .isArray()
    .withMessage("Les images doivent être un tableau"),
  
  body("images.*.url")
    .optional()
    .isURL()
    .withMessage("L\"URL de l\"image doit être valide"),
  
  body("images.*.description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("La description de l\"image ne peut pas dépasser 200 caractères")
];

// Validation pour la validation de rapport
const validateRapportValidation = [
  body('statut')
    .notEmpty()
    .withMessage('Le statut est requis')
    .isIn(['valide', 'rejete'])
    .withMessage('Le statut doit être "valide" ou "rejete"'),
  
  body('commentaire')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Le commentaire ne peut pas dépasser 1000 caractères')
];

// Routes
router.get('/', authenticateToken, getRapports);
router.get('/:id', authenticateToken, getRapportById);
router.post(
  "/",
  authenticateToken,
  requireRoles(["admin", "manager", "technicien"]),
  validate(createRapportValidation),
  createRapport
);
router.put(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "manager", "technicien"]),
  validate(updateRapportValidation),
  updateRapport
);router.patch('/:id/validate', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(validateRapportValidation),
  validateRapport
);
router.delete('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  deleteRapport
);

export default router;