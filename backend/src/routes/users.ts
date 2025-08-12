import { Router } from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getRoles,
  getProfile,
  updateProfile,
  changePassword
} from '@/controllers/userController';
import { authenticateToken, requireRoles } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router: Router = Router();

// Validation pour la création d'utilisateur
const createUserValidation = [
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
  
  body('email')
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail(),
  
  body('motDePasse')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Le numéro de téléphone doit être valide'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Le thème doit être "light" ou "dark"'),
  
  body('roleId')
    .notEmpty()
    .withMessage('Le rôle est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Le statut doit être "active", "inactive" ou "suspended"')
];

// Validation pour la mise à jour d'utilisateur
const updateUserValidation = [
  body('nom')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('prenom')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail(),
  
  body('motDePasse')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Le numéro de téléphone doit être valide'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Le thème doit être "light" ou "dark"'),
  
  body('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du rôle doit être un entier positif'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Le statut doit être "active", "inactive" ou "suspended"')
];

// Validation pour la mise à jour du profil
const updateProfileValidation = [
  body('nom')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  
  body('prenom')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Le numéro de téléphone doit être valide'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Le thème doit être "light" ou "dark"'),
  
  body('displayName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom d\'affichage doit contenir entre 2 et 100 caractères'),
  
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut pas dépasser 200 caractères'),
  
  body('state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('L\'état ne peut pas dépasser 100 caractères'),
  
  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le pays ne peut pas dépasser 100 caractères'),
  
  body('designation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La désignation ne peut pas dépasser 100 caractères')
];

// Validation pour le changement de mot de passe
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Validation pour la réinitialisation de mot de passe
const resetPasswordValidation = [
  body('newPassword')
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Routes

// Profil personnel (tous les utilisateurs authentifiés) - DOIT ÊTRE AVANT /:id
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', 
  authenticateToken,
  validate(updateProfileValidation),
  updateProfile
);
router.patch('/change-password', 
  authenticateToken,
  validate(changePasswordValidation),
  changePassword
);

// Routes spécifiques avant les routes paramétrées
router.get('/roles',
  authenticateToken,
  requireRoles(['admin']),
  getRoles
);

// CRUD Utilisateurs (DG/PDG uniquement)
router.get('/', 
  authenticateToken, 
  requireRoles(['admin']),
  getUsers
);

router.get('/:id',
  authenticateToken,
  requireRoles(['admin']),
  getUserById
);

router.post('/',
  authenticateToken,
  requireRoles(['admin']),
  validate(createUserValidation),
  createUser
);

router.put('/:id',
  authenticateToken,
  requireRoles(['admin']),
  validate(updateUserValidation),
  updateUser
);

router.delete('/:id',
  authenticateToken,
  requireRoles(['admin']),
  deleteUser
);

router.patch('/:id/toggle-status',
  authenticateToken,
  requireRoles(['admin']),
  toggleUserStatus
);

router.patch('/:id/reset-password',
  authenticateToken,
  requireRoles(['admin']),
  validate(resetPasswordValidation),
  resetUserPassword
);

export default router;