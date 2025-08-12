import { Router } from 'express';
import { body } from 'express-validator';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '@/controllers/clientController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { cache, invalidateCache } from '@/middleware/cache';

const router: Router = Router();

// Validation for client creation
const createClientValidation = [
  body('nom')
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('email')
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail(),
  
  body('telephone')
    .optional()
    .custom((value: string) => {
      if (!value || value.trim() === '') {
        return true;
      }
      
      const cleaned = value.replace(/[^\d]/g, "");
      if (cleaned.length !== 8 && cleaned.length !== 10) {
        throw new Error('Le numéro de téléphone doit contenir 8 ou 10 chiffres');
      }
      
      return true;
    })
    .withMessage('Le numéro de téléphone doit être valide (8 ou 10 chiffres)'),
  
  body('entreprise')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Le nom de l\'entreprise ne peut pas dépasser 200 caractères'),
  
  body('typeDeCart')
    .optional()
    .isIn(['Standard', 'Premium', 'VIP'])
    .withMessage('Le type de carte doit être "Standard", "Premium" ou "VIP"'),
  
  body('typePaiementId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du type de paiement doit être un entier positif'),
  
  body('localisation')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La localisation ne peut pas dépasser 500 caractères')
];

// Validation for client update
const updateClientValidation = [
  body('nom')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail(),
  
  body('telephone')
    .optional()
    .custom((value: string) => {
      if (!value || value.trim() === '') {
        return true;
      }
      
      const cleaned = value.replace(/[^\d]/g, "");
      if (cleaned.length !== 8 && cleaned.length !== 10) {
        throw new Error('Le numéro de téléphone doit contenir 8 ou 10 chiffres');
      }
      
      return true;
    })
    .withMessage('Le numéro de téléphone doit être valide (8 ou 10 chiffres)'),
  
  body('entreprise')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Le nom de l\'entreprise ne peut pas dépasser 200 caractères'),
  
  body('typeDeCart')
    .optional()
    .isIn(['Standard', 'Premium', 'VIP'])
    .withMessage('Le type de carte doit être "Standard", "Premium" ou "VIP"'),
  
  body('typePaiementId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du type de paiement doit être un entier positif'),
  
  body('localisation')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La localisation ne peut pas dépasser 500 caractères')
];

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Récupère la liste des clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Liste des clients récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/', 
  authenticateToken, 
  cache({ ttl: 300 }), // Cache 5 minutes
  getClients
);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Récupère un client par ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du client
 *     responses:
 *       200:
 *         description: Client récupéré avec succès
 *       404:
 *         description: Client non trouvé
 */
router.get('/:id', 
  authenticateToken, 
  cache({ ttl: 600 }), // Cache 10 minutes
  getClientById
);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Crée un nouveau client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Client créé avec succès
 *       400:
 *         description: Erreur de validation
 */
router.post('/', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'commercial']),
  validate(createClientValidation),
  invalidateCache(['GET:/api/clients*']),
  createClient
);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Met à jour un client existant
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du client à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client mis à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Client non trouvé
 */
router.put('/:id', 
  authenticateToken, 
  requireRoles(['admin', 'manager', 'commercial']),
  validate(updateClientValidation),
  invalidateCache(['GET:/api/clients*']),
  updateClient
);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Supprime un client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du client à supprimer
 *     responses:
 *       204:
 *         description: Client supprimé avec succès
 *       404:
 *         description: Client non trouvé
 */
router.delete('/:id', 
  authenticateToken, 
  requireRoles(['admin']),
  invalidateCache(['GET:/api/clients*']),
  deleteClient
);

export default router;