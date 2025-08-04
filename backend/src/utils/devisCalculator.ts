// Utilitaire pour les calculs de devis
export interface LigneDevis {
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montantHT?: number;
}

export interface CalculDevis {
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  lignes: LigneDevis[];
}

/**
 * Calcule les montants d'un devis
 * @param lignes - Les lignes du devis
 * @param tauxTVA - Le taux de TVA en pourcentage
 * @returns Les montants calculés
 */
export const calculateDevisMontants = (lignes: LigneDevis[], tauxTVA: number): CalculDevis => {
  // Calculer le montant HT de chaque ligne
  const lignesAvecMontant = lignes.map(ligne => ({
    ...ligne,
    montantHT: Math.round((ligne.quantite * ligne.prixUnitaire) * 100) / 100
  }));

  // Calculer le montant HT total
  const montantHT = lignesAvecMontant.reduce((sum, ligne) => sum + ligne.montantHT, 0);
  
  // Calculer la TVA
  const montantTVA = Math.round((montantHT * (tauxTVA / 100)) * 100) / 100;
  
  // Calculer le montant TTC
  const montantTTC = Math.round((montantHT + montantTVA) * 100) / 100;
  
  return {
    montantHT: Math.round(montantHT * 100) / 100,
    montantTVA,
    montantTTC,
    lignes: lignesAvecMontant
  };
};

/**
 * Valide une ligne de devis
 * @param ligne - La ligne à valider
 * @returns Les erreurs de validation
 */
export const validateLigneDevis = (ligne: LigneDevis): string[] => {
  const errors: string[] = [];

  if (!ligne.designation || ligne.designation.trim().length < 3) {
    errors.push('La désignation doit contenir au moins 3 caractères');
  }

  if (!ligne.quantite || ligne.quantite <= 0) {
    errors.push('La quantité doit être supérieure à 0');
  }

  if (!ligne.prixUnitaire || ligne.prixUnitaire < 0) {
    errors.push('Le prix unitaire doit être positif');
  }

  return errors;
};

/**
 * Valide un devis complet
 * @param lignes - Les lignes du devis
 * @param tauxTVA - Le taux de TVA
 * @returns Les erreurs de validation
 */
export const validateDevis = (lignes: LigneDevis[], tauxTVA: number): string[] => {
  const errors: string[] = [];

  if (!lignes || lignes.length === 0) {
    errors.push('Au moins une ligne de devis est requise');
    return errors;
  }

  if (tauxTVA < 0 || tauxTVA > 100) {
    errors.push('Le taux de TVA doit être entre 0 et 100%');
  }

  // Valider chaque ligne
  lignes.forEach((ligne, index) => {
    const ligneErrors = validateLigneDevis(ligne);
    ligneErrors.forEach(error => {
      errors.push(`Ligne ${index + 1}: ${error}`);
    });
  });

  return errors;
};

/**
 * Formate un montant en euros
 * @param montant - Le montant à formater
 * @returns Le montant formaté
 */
export const formatMontant = (montant: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(montant);
};

/**
 * Formate un pourcentage
 * @param pourcentage - Le pourcentage à formater
 * @returns Le pourcentage formaté
 */
export const formatPourcentage = (pourcentage: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(pourcentage / 100);
};

