import { Router } from 'express';
import { body } from 'express-validator';
import { login, refreshToken, getProfile } from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { authLimiter } from '@/middleware/rateLimiter';

const router: Router = Router();

// Validation pour la connexion
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('L\'email doit être valide')
    .normalizeEmail(),
  
  body('motDePasse')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

// Validation pour le refresh token
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Le refresh token est requis')
];

// Routes
router.post('/login', 
  authLimiter,
  validate(loginValidation),
  login
);

router.post('/refresh', 
  validate(refreshTokenValidation),
  refreshToken
);

router.get('/profile', 
  authenticateToken,
  getProfile
);

export default router;