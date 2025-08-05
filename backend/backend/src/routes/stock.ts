import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMateriels,
  getMaterielById,
  createMateriel,
  updateMateriel,
  createSortie,
  createEntree,
  checkDisponibilite,
  getAlertes,
  getStatsStock
} from '@/controllers/stockController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = Router();

// Validation pour la création de matériel
const createMaterielValidation = [
  body('reference')
    .notEmpty()
    .withMessage('La référence est requise')
    .isLength({ min: 2, max: 50 })
    .withMessage('La référence doit contenir entre 2 et 50 caractères'),
  
  body('designation')
    .notEmpty()
    .withMessage('La désignation est requise')
    .isLength({ min: 2, max: 200 })
    .withMessage('La désignation doit contenir entre 2 et 200 caractères'),
  
  body('quantiteTotale')
    .notEmpty()
    .withMessage('La quantité totale est requise')
    .isInt({ min: 0 })
    .withMessage('La quantité totale doit être un entier positif'),
  
  body('seuilAlerte')
    .notEmpty()
    .withMessage('Le seuil d\'alerte est requis')
    .isInt({ min: 0 })
    .withMessage('Le seuil d\'alerte doit être un entier positif'),
  
  body('categorie')
    .notEmpty()
    .withMessage('La catégorie est requise')
    .isIn(['Outillage', 'Pièce', 'Consommable', 'Équipement', 'Sécurité'])
    .withMessage('Catégorie invalide'),
  
  body('prixUnitaire')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix unitaire doit être positif'),
  
  body('dateAchat')
    .optional()
    .isISO8601()
    .withMessage('La date d\'achat doit être au format ISO 8601')
];

// Validation pour la sortie de matériel
const createSortieValidation = [
  body('materielId')
    .notEmpty()
    .withMessage('L\'ID du matériel est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du matériel doit être un entier positif'),
  
  body('interventionId')
    .notEmpty()
    .withMessage('L\'ID de l\'intervention est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'intervention doit être un entier positif'),
  
  body('technicienId')
    .notEmpty()
    .withMessage('L\'ID du technicien est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du technicien doit être un entier positif'),
  
  body('quantite')
    .notEmpty()
    .withMessage('La quantité est requise')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un entier positif')
];

// Validation pour la vérification de disponibilité
const checkDisponibiliteValidation = [
  body('materielId')
    .notEmpty()
    .withMessage('L\'ID du matériel est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du matériel doit être un entier positif'),
  
  body('quantiteRequise')
    .notEmpty()
    .withMessage('La quantité requise est requise')
    .isInt({ min: 1 })
    .withMessage('La quantité requise doit être un entier positif')
];

// Validation pour l'entrée de matériel
const createEntreeValidation = [
  body('materielId')
    .notEmpty()
    .withMessage('L\'ID du matériel est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du matériel doit être un entier positif'),
  
  body('quantite')
    .notEmpty()
    .withMessage('La quantité est requise')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un entier positif'),
  
  body('source')
    .notEmpty()
    .withMessage('La source est requise')
    .isIn(['achat', 'retour', 'transfert', 'reparation', 'autre'])
    .withMessage('Source invalide'),
  
  body('prixTotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix total doit être positif'),
  
  body('fournisseur')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Le nom du fournisseur ne peut pas dépasser 200 caractères'),
  
  body('facture')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le numéro de facture ne peut pas dépasser 100 caractères')
];

// Routes matériels
router.get('/materiels', authenticateToken, getMateriels);
router.get('/materiels/:id', authenticateToken, getMaterielById);
router.post('/materiels', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(createMaterielValidation),
  createMateriel
);
router.put('/materiels/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(createMaterielValidation),
  updateMateriel
);

// Routes sorties
router.post('/sorties', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'technicien']),
  validate(createSortieValidation),
  createSortie
);

// Routes entrées
router.post('/entrees', 
  authenticateToken, 
  requireRoles(['admin', 'manager']),
  validate(createEntreeValidation),
  createEntree
);

// Routes utilitaires
router.post('/check-disponibilite',
  authenticateToken,
  validate(checkDisponibiliteValidation),
  checkDisponibilite
);

router.get('/alertes', authenticateToken, getAlertes);
router.get('/stats', authenticateToken, getStatsStock);

export default router;