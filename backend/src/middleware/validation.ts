import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { logger } from '@/config/logger';

// Client-side validation schemas
export const clientValidationSchemas = {
  email: {
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    message: 'Format email invalide'
  },
  phone: [
    {
      custom: (value: string) => {
        if (!value || value.trim() === "") return true;
        
        const cleaned = value.replace(/[^\d]/g, "");
        
        // Vérifier la longueur
        if (cleaned.length !== 8 && cleaned.length !== 10) {
          return false;
        }
        
        // Vérifications supplémentaires pour éviter des numéros invalides
        if (cleaned.length === 10 && !cleaned.startsWith("0")) {
          return false;
        }
        
        return true;
      },
      message: "Le numéro de téléphone doit être valide (8 ou 10 chiffres)"
    }
  ],
  password: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    message: 'Mot de passe: 8+ caractères, majuscule, minuscule, chiffre'
  }
};

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: (error as any).param || (error as any).path || 'unknown',
      message: error.msg,
      value: (error as any).value,
      location: (error as any).location ?? ''
    }));

    logger.warn('Validation errors:', errorMessages);

    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Erreurs de validation',
      errors: errorMessages
    });
    return;
  }

  next();
};

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));
    handleValidationErrors(req, res, next);
  };
};