interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
  message: string;
}

interface ValidationSchema {
  [key: string]: ValidationRule[];
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export class Validator {
  static validate(data: Record<string, unknown>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string[]> = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors: string[] = [];

      for (const rule of rules) {
        if (rule.required && (value === undefined || value === null || value === '')) {
          fieldErrors.push(rule.message);
          continue;
        }

        if (value !== undefined && value !== null && value !== '') {
          if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
            fieldErrors.push(rule.message);
          }

          if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
            fieldErrors.push(rule.message);
          }

          if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
            fieldErrors.push(rule.message);
          }

          if (rule.custom && !rule.custom(value)) {
            fieldErrors.push(rule.message);
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  // Schémas de validation prédéfinis
  static schemas = {
    client: {
      nom: [
        { required: true, message: 'Le nom est requis' },
        { minLength: 2, message: 'Le nom doit contenir au moins 2 caractères' },
        { maxLength: 100, message: 'Le nom ne peut pas dépasser 100 caractères' }
      ],
      email: [
        { required: true, message: 'L\'email est requis' },
        { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email invalide' }
      ],
      telephone: [
        { pattern: /^(?:\+225|00225)?\s*\d{8,10}\s*$/, message: 'Numéro de téléphone invalide' }
      ]
    },
    
    mission: {
      natureIntervention: [
        { required: true, message: 'La nature de l\'intervention est requise' },
        { minLength: 3, message: 'Minimum 3 caractères' },
        { maxLength: 255, message: 'Maximum 255 caractères' }
      ],
      objectifDuContrat: [
        { required: true, message: 'L\'objectif du contrat est requis' },
        { minLength: 3, message: 'Minimum 3 caractères' }
      ],
      clientId: [
        { required: true, message: 'Le client est requis' },
        { custom: (value) => typeof value === 'number' && value > 0, message: 'Client invalide' }
      ]
    },
    
    devis: {
      titre: [
        { required: true, message: 'Le titre est requis' },
        { minLength: 3, message: 'Minimum 3 caractères' },
        { maxLength: 200, message: 'Maximum 200 caractères' }
      ],
      clientId: [
        { required: true, message: 'Le client est requis' }
      ],
      dateValidite: [
        { required: true, message: 'La date de validité est requise' },
        { custom: (value) => new Date(value as string) > new Date(), message: 'La date doit être future' }
      ]
    },
    
    user: {
      nom: [
        { required: true, message: 'Le nom est requis' },
        { minLength: 2, message: 'Minimum 2 caractères' }
      ],
      prenom: [
        { required: true, message: 'Le prénom est requis' },
        { minLength: 2, message: 'Minimum 2 caractères' }
      ],
      email: [
        { required: true, message: 'L\'email est requis' },
        { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email invalide' }
      ],
      motDePasse: [
        { required: true, message: 'Le mot de passe est requis' },
        { minLength: 8, message: 'Minimum 8 caractères' },
        { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Doit contenir majuscule, minuscule et chiffre' }
      ]
    }
  };
}

// Hook pour la validation en temps réel
export function useValidation<T extends Record<string, unknown>>(
  schema: ValidationSchema
) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const validate = useCallback((data: T): boolean => {
    const result = Validator.validate(data, schema);
    setErrors(result.errors);
    return result.isValid;
  }, [schema]);

  const validateField = useCallback((field: string, value: unknown): boolean => {
    if (schema[field]) {
      const result = Validator.validate({ [field]: value }, { [field]: schema[field] });
      setErrors(prev => ({
        ...prev,
        [field]: result.errors[field] || []
      }));
      return result.isValid;
    }
    return true;
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
}

export default Validator;