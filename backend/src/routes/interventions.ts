import { Router } from 'express';
import { body } from 'express-validator';
import {
  getInterventions,
  getInterventionById,
  createIntervention,
  updateIntervention,
  checkAvailability,
  deleteIntervention
} from '@/controllers/interventionController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router: Router = Router();

// Validation pour la création d'intervention
const createInterventionValidation = [
  body('dateHeureDebut')
    .optional()
    .isISO8601()
    .withMessage('La date de début doit être au format ISO 8601'),
  
  body('dateHeureFin')
    .optional()
    .isISO8601()
    .withMessage('La date de fin doit être au format ISO 8601'),
  
  body('duree')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La durée doit être un entier positif (en minutes)'),
  
  body('missionId')
    .notEmpty()
    .withMessage('L\'ID de la mission est requis')
    .isString()
    .withMessage('L\'ID de la mission doit être une chaîne de caractères'),
  
  body('techniciens')
    .isArray({ min: 1 })
    .withMessage('Au moins un technicien doit être assigné'),
  
  body('techniciens.*.technicienId')
    .isInt({ min: 1 })
    .withMessage('L\'ID du technicien doit être un entier positif'),
  
  body('techniciens.*.role')
    .optional()
    .isIn(['principal', 'assistant', 'expert'])
    .withMessage('Le rôle doit être "principal", "assistant" ou "expert"'),
  
  body("techniciens.*.commentaire")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Le commentaire ne peut pas dépasser 500 caractères"),

  body("materiels")
    .optional()
    .isArray()
    .withMessage("Les matériels doivent être un tableau"),

  body("materiels.*.materielId")
    .isInt({ min: 1 })
    .withMessage("L'ID du matériel doit être un entier positif"),

  body("materiels.*.quantite")
    .isInt({ min: 1 })
    .withMessage("La quantité doit être un entier positif"),

  body("materiels.*.commentaire")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Le commentaire du matériel ne peut pas dépasser 500 caractères")
];

// Validation pour la mise à jour d'intervention
const updateInterventionValidation = [
  body("dateHeureDebut")
    .optional()
    .isISO8601()
    .withMessage("La date de début doit être au format ISO 8601"),

  body("dateHeureFin")
    .optional()
    .isISO8601()
    .withMessage("La date de fin doit être au format ISO 8601"),

  body("duree")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La durée doit être un entier positif (en minutes)"),

  body("techniciens")
    .optional()
    .isArray()
    .withMessage("Les techniciens doivent être un tableau"),

  body("techniciens.*.technicienId")
    .isInt({ min: 1 })
    .withMessage("L'ID du technicien doit être un entier positif"),

  body("techniciens.*.role")
    .optional()
    .isIn(["principal", "assistant", "expert"])
    .withMessage("Le rôle doit être \"principal\", \"assistant\" ou \"expert\""),

  body("techniciens.*.commentaire")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Le commentaire ne peut pas dépasser 500 caractères"),

  body("materiels")
    .optional()
    .isArray()
    .withMessage("Les matériels doivent être un tableau"),

  body("materiels.*.materielId")
    .isInt({ min: 1 })
    .withMessage("L'ID du matériel doit être un entier positif"),

  body("materiels.*.quantite")
    .isInt({ min: 1 })
    .withMessage("La quantité doit être un entier positif"),

  body("materiels.*.commentaire")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Le commentaire du matériel ne peut pas dépasser 500 caractères")
];

// Validation pour la vérification de disponibilité
const checkAvailabilityValidation = [
  body('technicienId')
    .notEmpty()
    .withMessage('L\'ID du technicien est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du technicien doit être un entier positif'),
  
  body('dateHeureDebut')
    .notEmpty()
    .withMessage('La date de début est requise')
    .isISO8601()
    .withMessage('La date de début doit être au format ISO 8601'),
  
  body('dateHeureFin')
    .notEmpty()
    .withMessage('La date de fin est requise')
    .isISO8601()
    .withMessage('La date de fin doit être au format ISO 8601'),
  
  body('excludeInterventionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID d\'intervention à exclure doit être un entier positif')
];

// Routes
router.get('/', authenticateToken, getInterventions);
router.get('/:id', authenticateToken, getInterventionById);
router.post('/', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'technicien']),
  validate(createInterventionValidation),
  createIntervention
);
router.put('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'technicien']),
  validate(updateInterventionValidation),
  updateIntervention
);
router.post('/check-availability',
  authenticateToken,
  validate(checkAvailabilityValidation),
  checkAvailability
);
router.delete('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  deleteIntervention
);

export default router;