import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMissions,
  getMissionById,
  createMission,
  updateMission,
  deleteMission
} from '@/controllers/missionController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = Router();

// Validation pour la création de mission
const createMissionValidation = [
  body('natureIntervention')
    .notEmpty()
    .withMessage('La nature de l\'intervention est requise')
    .isLength({ min: 3, max: 255 })
    .withMessage('La nature de l\'intervention doit contenir entre 3 et 255 caractères'),
  
  body('objectifDuContrat')
    .notEmpty()
    .withMessage('L\'objectif du contrat est requis')
    .isLength({ min: 3, max: 500 })
    .withMessage('L\'objectif du contrat doit contenir entre 3 et 500 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  
  body('priorite')
    .optional()
    .isIn(['normale', 'urgente'])
    .withMessage('La priorité doit être "normale" ou "urgente"'),
  
  body('statut')
    .optional()
    .isIn(['planifiee', 'en_cours', 'terminee', 'annulee'])
    .withMessage('Le statut doit être "planifiee", "en_cours", "terminee" ou "annulee"'),
  
  body('priorite')
    .optional()
    .isIn(['normale', 'urgente'])
    .withMessage('La priorité doit être "normale" ou "urgente"'),
  
  body('statut')
    .optional()
    .isIn(['planifiee', 'en_cours', 'terminee', 'annulee'])
    .withMessage('Le statut doit être "planifiee", "en_cours", "terminee" ou "annulee"'),
  
  body('dateSortieFicheIntervention')
    .notEmpty()
    .withMessage('La date de sortie est requise')
    .isISO8601()
    .withMessage('La date de sortie doit être au format ISO 8601'),
  
  body('clientId')
    .notEmpty()
    .withMessage('L\'ID du client est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du client doit être un entier positif')
];

// Validation pour la mise à jour de mission
const updateMissionValidation = [
  body('natureIntervention')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('La nature de l\'intervention doit contenir entre 3 et 255 caractères'),
  
  body('objectifDuContrat')
    .optional()
    .isLength({ min: 3, max: 500 })
    .withMessage('L\'objectif du contrat doit contenir entre 3 et 500 caractères'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  
  body('priorite')
    .optional()
    .isIn(['normale', 'urgente'])
    .withMessage('La priorité doit être "normale" ou "urgente"'),
  
  body('statut')
    .optional()
    .isIn(['planifiee', 'en_cours', 'terminee', 'annulee'])
    .withMessage('Le statut doit être "planifiee", "en_cours", "terminee" ou "annulee"'),
  
  body('priorite')
    .optional()
    .isIn(['normale', 'urgente'])
    .withMessage('La priorité doit être "normale" ou "urgente"'),
  
  body('statut')
    .optional()
    .isIn(['planifiee', 'en_cours', 'terminee', 'annulee'])
    .withMessage('Le statut doit être "planifiee", "en_cours", "terminee" ou "annulee"'),
  
  body('dateSortieFicheIntervention')
    .optional()
    .isISO8601()
    .withMessage('La date de sortie doit être au format ISO 8601'),
  
  body('clientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du client doit être un entier positif')
];

// Routes
router.get('/', authenticateToken, getMissions);
router.get('/:numIntervention', authenticateToken, getMissionById);
router.post('/', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'commercial']),
  validate(createMissionValidation),
  createMission
);
router.put('/:numIntervention', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(updateMissionValidation),
  updateMission
);
router.delete('/:numIntervention', 
  authenticateToken, 
  requireRoles(['admin']),
  deleteMission
);

export default router;